import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { isValidObjectId, type Model } from "mongoose";
import {
  GAME_STATUSES,
  GAME_TYPES,
  type IAddGameRequest,
} from "@mooncellar/schemas";
import { Game } from "../schemas/game.schema";
import { Platform } from "../schemas/platform.schema";
import { GameAiDraft } from "../schemas/game-ai-draft.schema";
import { FileService } from "../../user/services/file-upload.service";
import { S3_FOLDERS } from "../../../shared/s3";
import {
  searchImages,
  searchWeb,
  searchYoutube,
} from "../../../shared/searxng";
import {
  downloadRemoteImage,
  downloadRemotePage,
} from "../../../shared/remote-image";
import { toReleaseDate } from "../../../shared/release-date";
import { uniqueSlug } from "../../../shared/utils";
import { VNDB_WORLDWIDE_REGION } from "../constants/vndb";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const STEAMGRIDDB_URL = "https://www.steamgriddb.com/api/v2";
const STEAMGRIDDB_IMAGES_LIMIT = 5;
const MAX_TURNS = 12;
const TOOL_FAILED = "Tool failed:";
const PAGE_TEXT_LIMIT = 30_000;
const PAGE_IMAGES_LIMIT = 40;
const RUNS_LIMIT = 20;
const STEPS_LIMIT = 100;

type IFilters = Record<
  | "genres"
  | "themes"
  | "modes"
  | "player_perspectives"
  | "game_engines"
  | "languages"
  | "companies",
  string[]
>;

type IOpenAiOutput =
  | { type: "function_call"; call_id: string; name: string; arguments: string }
  | { type: "message"; content: { type: string; text?: string }[] }
  | { type: string };

type IDraft = {
  name: string;
  alternative_names: string[];
  type: string;
  status: string | null;
  summary: string | null;
  storyline: string | null;
  first_release: string | null;
  genres: string[];
  themes: string[];
  modes: string[];
  player_perspectives: string[];
  game_engines: string[];
  languages: string[];
  keywords: string[];
  franchises: string[];
  companies: {
    name: string;
    developer: boolean;
    publisher: boolean;
    porting: boolean;
    supporting: boolean;
  }[];
  platforms: string[];
  release_dates: { date: string; platform: string }[];
  cover: string | null;
  screenshots: string[];
  artworks: string[];
  videos: string[];
  websites: string[];
  externalPages: { name: string; uid: string; url: string }[];
};

const str = { type: "string" };
const nullableStr = { type: ["string", "null"] };
const strList = { type: "array", items: str };
const enumList = (values: string[]) => ({
  type: "array",
  items: { type: "string", enum: values },
});
const object = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const QUERY_TOOL = object({ query: str });

const TOOLS = [
  {
    name: "search_web",
    description:
      "Web search. Use it to research release dates, developers, platforms, genres, store pages.",
    parameters: QUERY_TOOL,
  },
  {
    name: "search_images",
    description:
      "Image search. Returns img_src URLs usable as cover, screenshots or artworks.",
    parameters: QUERY_TOOL,
  },
  {
    name: "search_youtube",
    description: "YouTube search for trailers and gameplay videos.",
    parameters: QUERY_TOOL,
  },
  {
    name: "search_steamgriddb",
    description:
      "SteamGridDB artwork for a game: portrait covers (grids) and wide banners (heroes). Pass the Steam app id when the game is on Steam, otherwise the game name.",
    parameters: object({ steam_app_id: nullableStr, name: nullableStr }),
  },
  {
    name: "fetch_page",
    description:
      "Fetch a web page and return its title, text and image URLs. Use it on the link the admin gave and on store/wiki pages found by search.",
    parameters: object({ url: str }),
  },
].map((tool) => ({ type: "function", strict: true, ...tool }));

const INSTRUCTIONS = `You research one video game and fill a database record for it, the way a careful editor would.
The admin gives either a game name or a link to a page about the game. When it is a link, fetch it first.
Research with the tools, then answer with the record only.
Rules:
- Every text field is in English, whatever language the sources use; translate.
- Use only facts a source supports. Leave a field empty or null rather than guess.
- type, status, genres, themes, modes and player_perspectives must be picked from the allowed values in the schema.
- game_engines, languages and company names: prefer the exact spelling from the known lists given below when one matches.
- platforms and release_dates.platform are platform slugs from the schema enum.
- Dates are "YYYY-MM-DD", or "YYYY-MM" / "YYYY" when the day or month is unknown. first_release is the earliest release date.
- Always call search_steamgriddb. cover is its best portrait grid; only when it has none, use another portrait image close to a 3:4 ratio (box art, poster), never a landscape banner. Never build or guess an image URL.
- artworks are promotional or key art, at most 5: put the best SteamGridDB heroes there first (largest first), then other key art. screenshots are in-game captures, at most 10. Do not put the same image in both.
- videos are YouTube links to trailers or gameplay.
- externalPages: for a Steam game always add {name: "Steam", uid: "<app id>", url: "https://store.steampowered.com/app/<app id>"}, plus other store or database pages found (GOG, itch.io, Epic Games, DLsite...).
- websites are official sites and social pages.
- Image URLs must be direct links to image files, taken from tool results.
- Research in few rounds: call several tools at once whenever the calls do not depend on each other, and answer as soon as the main fields are covered. You have at most ${MAX_TURNS} rounds of tool calls.`;

@Injectable()
export class GameAiDraftService implements OnModuleInit {
  private readonly logger = new Logger(GameAiDraftService.name);

  constructor(
    @InjectModel(Game.name) private readonly Games: Model<Game>,
    @InjectModel(Platform.name) private readonly Platforms: Model<Platform>,
    @InjectModel(GameAiDraft.name)
    private readonly Drafts: Model<GameAiDraft>,
    private readonly fileService: FileService
  ) {}

  async onModuleInit() {
    await this.Drafts.updateMany(
      { status: "running" },
      { status: "failed", error: "Interrupted by an API restart" }
    );
  }

  getRuns() {
    return this.Drafts.find().sort({ createdAt: -1 }).limit(RUNS_LIMIT).lean();
  }

  async deleteRun(id: string) {
    const run = isValidObjectId(id)
      ? await this.Drafts.findById(id).select("status").lean()
      : null;

    if (!run) throw new NotFoundException("AI draft run not found");
    if (run.status === "running") {
      throw new ConflictException("A running AI draft cannot be deleted");
    }

    await this.Drafts.deleteOne({ _id: id });
  }

  private async pruneRuns() {
    const stale = await this.Drafts.find({ status: { $ne: "running" } })
      .sort({ createdAt: -1 })
      .skip(RUNS_LIMIT)
      .select("_id")
      .lean();

    if (stale.length) {
      await this.Drafts.deleteMany({
        _id: { $in: stale.map(({ _id }) => _id) },
      });
    }
  }

  async startRun(query: string) {
    if (!process.env.OPENAI_API_KEY) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is not set");
    }

    const run = await this.Drafts.create({ query });
    await this.pruneRuns();
    const addStep = (step: string) =>
      this.Drafts.updateOne(
        { _id: run._id },
        { $push: { steps: { $each: [step], $slice: -STEPS_LIMIT } } }
      ).catch((err) => this.logger.error(err, "Failed to save a draft step"));

    this.createDraft(query, addStep)
      .then((draft) =>
        this.Drafts.updateOne({ _id: run._id }, { status: "done", draft })
      )
      .catch((err: Error) => {
        this.logger.error(err, `AI draft failed: ${query}`);

        return this.Drafts.updateOne(
          { _id: run._id },
          { status: "failed", error: err.message }
        );
      })
      .catch((err) => this.logger.error(err, "Failed to save a draft result"));

    return run.toObject();
  }

  private async createDraft(
    query: string,
    addStep: (step: string) => Promise<unknown>
  ): Promise<Partial<IAddGameRequest>> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is not set");
    }

    const [platforms, filters] = await Promise.all([
      this.Platforms.find().select("_id name slug").lean(),
      this.getFilters(),
    ]);

    const schema = this.getSchema(
      platforms.map(({ slug }) => slug),
      filters
    );
    const knownLists = [
      `Platforms (slug: name): ${platforms.map(({ slug, name }) => `${slug}: ${name}`).join("; ")}`,
      `Known game engines: ${filters.game_engines.join("; ")}`,
      `Known languages: ${filters.languages.join("; ")}`,
    ].join("\n");

    let body: Record<string, unknown> = {
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: `${INSTRUCTIONS}\n\n${knownLists}`,
      input: query,
      tools: TOOLS,
      text: {
        format: { type: "json_schema", name: "game", strict: true, schema },
      },
    };

    for (let turn = 0; turn <= MAX_TURNS; turn++) {
      const isLastTurn = turn === MAX_TURNS;

      await addStep(
        isLastTurn
          ? "Out of research rounds, asking for the draft"
          : turn
            ? "Reading the results"
            : "Asking OpenAI"
      );
      const response = await this.callOpenAi(apiKey, {
        ...body,
        tool_choice: isLastTurn ? "none" : "auto",
      });
      const calls = response.output.filter(
        (item): item is Extract<IOpenAiOutput, { type: "function_call" }> =>
          item.type === "function_call"
      );

      if (!calls.length) {
        const text = response.output
          .flatMap((item) => ("content" in item ? item.content : []))
          .find((content) => content.type === "output_text")?.text;

        if (!text) throw new BadGatewayException("OpenAI returned no draft");

        await addStep("Building the draft");

        return this.toGame(JSON.parse(text) as IDraft, platforms, filters);
      }

      body = {
        ...body,
        previous_response_id: response.id,
        input: await Promise.all(
          calls.map(async (call) => {
            const step = `${call.name} ${this.describeArgs(call.arguments)}`;

            await addStep(step);
            const output = await this.runTool(call.name, call.arguments);

            if (output.startsWith(TOOL_FAILED)) {
              await addStep(`${step}: ${output}`);
            }

            return {
              type: "function_call_output",
              call_id: call.call_id,
              output,
            };
          })
        ),
      };
    }

    throw new BadGatewayException("OpenAI did not finish the research");
  }

  private async callOpenAi(apiKey: string, body: Record<string, unknown>) {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`OpenAI request failed: ${res.status} ${text}`);
      throw new BadGatewayException(`OpenAI request failed: ${res.status}`);
    }

    return (await res.json()) as { id: string; output: IOpenAiOutput[] };
  }

  private describeArgs(rawArgs: string) {
    try {
      const { query, url, steam_app_id, name } = JSON.parse(rawArgs) as {
        query?: string;
        url?: string;
        steam_app_id?: string | null;
        name?: string | null;
      };

      return query ?? url ?? steam_app_id ?? name ?? "";
    } catch {
      return "";
    }
  }

  private async runTool(name: string, rawArgs: string) {
    try {
      const args = JSON.parse(rawArgs) as {
        query?: string;
        url?: string;
        steam_app_id?: string | null;
        name?: string | null;
      };
      const result =
        name === "search_web"
          ? await searchWeb(args.query)
          : name === "search_images"
            ? await searchImages(args.query)
            : name === "search_youtube"
              ? await searchYoutube(args.query)
              : name === "search_steamgriddb"
                ? await this.searchSteamGridDb(args)
                : name === "fetch_page"
                  ? await this.fetchPage(args.url)
                  : `Unknown tool: ${name}`;

      return typeof result === "string" ? result : JSON.stringify(result);
    } catch (err) {
      return `${TOOL_FAILED} ${(err as Error).message}`;
    }
  }

  private async keepImages(urls: (string | null)[]) {
    const checked = await Promise.all(
      urls.map((url) =>
        url
          ? downloadRemoteImage(url)
              .then(() => url)
              .catch(() => null)
          : null
      )
    );

    return checked.filter((url): url is string => !!url);
  }

  private async steamGridDb<T>(path: string): Promise<T> {
    const apiKey = process.env.STEAMGRIDDB_API_KEY;

    if (!apiKey) throw new Error("STEAMGRIDDB_API_KEY is not set");

    const res = await fetch(`${STEAMGRIDDB_URL}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`SteamGridDB ${res.status}`);

    return ((await res.json()) as { data: T }).data;
  }

  private async searchSteamGridDb({
    steam_app_id,
    name,
  }: {
    steam_app_id?: string | null;
    name?: string | null;
  }) {
    const game = steam_app_id
      ? await this.steamGridDb<{ id: number; name: string }>(
          `/games/steam/${encodeURIComponent(steam_app_id)}`
        )
      : name
        ? (
            await this.steamGridDb<{ id: number; name: string }[]>(
              `/search/autocomplete/${encodeURIComponent(name)}`
            )
          )?.[0]
        : null;

    if (!game) return "Game not found on SteamGridDB";

    const images = async (kind: "grids" | "heroes", query: string) =>
      (
        (await this.steamGridDb<
          { url: string; width: number; height: number; score: number }[]
        >(`/${kind}/game/${game.id}?${query}`)) ?? []
      )
        .sort((a, b) => b.score - a.score || b.width - a.width)
        .slice(0, STEAMGRIDDB_IMAGES_LIMIT)
        .map(({ url, width, height }) => ({ url, width, height }));

    const [covers, heroes] = await Promise.all([
      images("grids", "dimensions=600x900,660x930&nsfw=any&humor=false"),
      images("heroes", "nsfw=any&humor=false"),
    ]);

    return { game: game.name, covers, heroes };
  }

  private async fetchPage(url: string) {
    const html = await downloadRemotePage(url);
    const absolute = (src: string) => {
      try {
        return new URL(src, url).toString();
      } catch {
        return null;
      }
    };
    const images = [
      ...html.matchAll(
        /<meta[^>]+(?:property|name)="(?:og:image|twitter:image)"[^>]+content="([^"]+)"/gi
      ),
      ...html.matchAll(/<img[^>]+src="([^"]+)"/gi),
    ]
      .map(([, src]) => absolute(src))
      .filter((src): src is string => !!src && /^https?:/.test(src));
    const text = html
      .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();

    return {
      title: html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim(),
      text: text.slice(0, PAGE_TEXT_LIMIT),
      images: [...new Set(images)].slice(0, PAGE_IMAGES_LIMIT),
    };
  }

  private async getFilters(): Promise<IFilters> {
    const { content } = await this.fileService.getFile(
      S3_FOLDERS.common,
      "filters"
    );
    const filters = JSON.parse(content as string) as Partial<IFilters>;

    return {
      genres: filters.genres ?? [],
      themes: filters.themes ?? [],
      modes: filters.modes ?? [],
      player_perspectives: filters.player_perspectives ?? [],
      game_engines: filters.game_engines ?? [],
      languages: filters.languages ?? [],
      companies: filters.companies ?? [],
    };
  }

  private getSchema(platformSlugs: string[], filters: IFilters) {
    return object({
      name: str,
      alternative_names: strList,
      type: { type: "string", enum: [...GAME_TYPES] },
      status: { type: ["string", "null"], enum: [...GAME_STATUSES, null] },
      summary: nullableStr,
      storyline: nullableStr,
      first_release: nullableStr,
      genres: enumList(filters.genres),
      themes: enumList(filters.themes),
      modes: enumList(filters.modes),
      player_perspectives: enumList(filters.player_perspectives),
      game_engines: strList,
      languages: strList,
      keywords: strList,
      franchises: strList,
      companies: {
        type: "array",
        items: object({
          name: str,
          developer: { type: "boolean" },
          publisher: { type: "boolean" },
          porting: { type: "boolean" },
          supporting: { type: "boolean" },
        }),
      },
      platforms: enumList(platformSlugs),
      release_dates: {
        type: "array",
        items: object({
          date: str,
          platform: { type: "string", enum: platformSlugs },
        }),
      },
      cover: nullableStr,
      screenshots: strList,
      artworks: strList,
      videos: strList,
      websites: strList,
      externalPages: {
        type: "array",
        items: object({ name: str, uid: str, url: str }),
      },
    });
  }

  private async toGame(
    draft: IDraft,
    platforms: { _id: unknown; slug: string }[],
    filters: IFilters
  ): Promise<Partial<IAddGameRequest>> {
    const platformId = new Map(
      platforms.map(({ _id, slug }) => [slug, String(_id)])
    );
    const canonical = (known: string[]) => {
      const byLower = new Map(
        known.map((value) => [value.toLowerCase(), value])
      );

      return (value: string) => byLower.get(value.toLowerCase()) ?? value;
    };
    const toKnown = (values: string[], known: string[]) => {
      const byLower = new Map(
        known.map((value) => [value.toLowerCase(), value])
      );

      return [
        ...new Set(
          values
            .map((value) => byLower.get(value.toLowerCase()))
            .filter(Boolean)
        ),
      ];
    };
    const companyName = canonical(filters.companies);
    const firstRelease = toReleaseDate(draft.first_release);

    return {
      name: draft.name,
      slug: await uniqueSlug((slug) => this.Games.exists({ slug }), draft.name),
      alternative_names: draft.alternative_names,
      type: draft.type as IAddGameRequest["type"],
      status: draft.status as IAddGameRequest["status"],
      summary: draft.summary ?? undefined,
      storyline: draft.storyline ?? undefined,
      first_release: firstRelease?.date ?? null,
      genres: draft.genres,
      themes: draft.themes,
      modes: draft.modes,
      player_perspectives: draft.player_perspectives,
      game_engines: toKnown(draft.game_engines, filters.game_engines),
      languages: toKnown(draft.languages, filters.languages),
      keywords: draft.keywords,
      franchises: draft.franchises,
      companies: draft.companies.map((company) => ({
        ...company,
        name: companyName(company.name),
      })),
      platformIds: [
        ...new Set(
          draft.platforms.map((slug) => platformId.get(slug)).filter(Boolean)
        ),
      ],
      release_dates: draft.release_dates.flatMap(({ date, platform }) => {
        const releaseDate = toReleaseDate(date);
        const id = platformId.get(platform);

        return releaseDate && id
          ? [{ ...releaseDate, platformId: id, region: VNDB_WORLDWIDE_REGION }]
          : [];
      }),
      cover: (await this.keepImages([draft.cover]))[0] ?? null,
      screenshots: await this.keepImages(draft.screenshots.slice(0, 10)),
      artworks: await this.keepImages(draft.artworks.slice(0, 5)),
      videos: draft.videos,
      websites: draft.websites,
      externalPages: draft.externalPages,
    };
  }
}
