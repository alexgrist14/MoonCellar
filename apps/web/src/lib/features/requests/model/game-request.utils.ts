import {
  IGameRequestPayload,
  IPlatform,
  IRelatedGameKey,
} from "@mooncellar/schemas";
import { ISearchPickerOption } from "@/src/lib/shared/ui/SearchPicker";

type IRow = Record<string, unknown>;

export interface IRelatedEntry {
  relation: Exclude<IRelatedGameKey, "parent_game">;
  game: ISearchPickerOption;
}

export interface IGameDraft {
  name: string;
  versionTitle: string;
  type: string;
  status: string;
  first_release?: number | null;
  alternative_names: string[];
  release_dates: IRow[];
  platforms: string[];
  genres: string[];
  modes: string[];
  themes: string[];
  keywords: string[];
  franchises: string[];
  game_engines: string[];
  player_perspectives: string[];
  languages: string[];
  companies: IRow[];
  summary: string;
  storyline: string;
  multiplayer_modes: IRow[];
  ageRatings: IRow[];
  websites: string[];
  videos: string[];
  externalPages: IRow[];
  related: IRelatedEntry[];
  parent?: ISearchPickerOption;
  cover: string;
  screenshots: string[];
  artworks: string[];
  igdbId: string;
  vndbId: string;
  hltbId: string;
  retroachievements: IRow[];
}

export const EMPTY_GAME_DRAFT: IGameDraft = {
  name: "",
  versionTitle: "",
  type: "",
  status: "",
  first_release: undefined,
  alternative_names: [],
  release_dates: [],
  platforms: [],
  genres: [],
  modes: [],
  themes: [],
  keywords: [],
  franchises: [],
  game_engines: [],
  player_perspectives: [],
  languages: [],
  companies: [],
  summary: "",
  storyline: "",
  multiplayer_modes: [],
  ageRatings: [],
  websites: [],
  videos: [],
  externalPages: [],
  related: [],
  parent: undefined,
  cover: "",
  screenshots: [],
  artworks: [],
  igdbId: "",
  vndbId: "",
  hltbId: "",
  retroachievements: [],
};

const isEmptyValue = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === false ||
  (typeof value === "string" && !value.trim()) ||
  (Array.isArray(value) && !value.length);

export const compact = (value: IRow) =>
  Object.fromEntries(
    Object.entries(value).filter(
      ([, item]) => !isEmptyValue(item) || typeof item === "boolean"
    )
  );

const filledRows = (rows: IRow[]) =>
  rows.filter((row) =>
    Object.values(row).some((value) => !isEmptyValue(value))
  );

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : undefined;

const toNumber = (value: unknown) =>
  value === undefined || value === null || value === ""
    ? undefined
    : Number(value);

export const buildGamePayload = (
  draft: IGameDraft,
  systems: IPlatform[] = []
): IGameRequestPayload => {
  const platformId = (name: unknown) => {
    const label = text(name);

    if (!label) return undefined;

    const id = systems.find((system) => system.name === label)?._id;

    if (!id) throw new Error(`Unknown platform: ${label}`);

    return id;
  };

  const relatedGames = draft.related.reduce<Record<string, string[]>>(
    (groups, { relation, game }) => ({
      ...groups,
      [relation]: [...(groups[relation] ?? []), game.id],
    }),
    {}
  );

  const payload = compact({
    name: draft.name.trim(),
    versionTitle: draft.versionTitle.trim(),
    type: draft.type,
    status: draft.status,
    first_release: draft.first_release,
    alternative_names: draft.alternative_names,
    release_dates: filledRows(draft.release_dates).map((row) =>
      compact({
        date: row.date,
        platformId: platformId(row.platform),
        region: toNumber(row.region),
      })
    ),
    platformIds: draft.platforms.map(platformId),
    genres: draft.genres,
    modes: draft.modes,
    themes: draft.themes,
    keywords: draft.keywords,
    franchises: draft.franchises,
    game_engines: draft.game_engines,
    player_perspectives: draft.player_perspectives,
    languages: draft.languages,
    companies: filledRows(draft.companies).map((row) => ({
      name: text(row.name),
      developer: !!row.developer,
      publisher: !!row.publisher,
      porting: !!row.porting,
      supporting: !!row.supporting,
    })),
    summary: draft.summary.trim(),
    storyline: draft.storyline.trim(),
    multiplayer_modes: filledRows(draft.multiplayer_modes).map((row) => {
      const { platform, ...rest } = row;

      return compact({
        ...Object.fromEntries(
          Object.entries(rest).map(([key, value]) => [
            key,
            typeof value === "boolean" ? value : toNumber(value),
          ])
        ),
        platformId: platformId(platform),
      });
    }),
    ageRatings: filledRows(draft.ageRatings).map((row) =>
      compact({
        organization: text(row.organization),
        rating: text(row.rating),
        synopsis: text(row.synopsis),
      })
    ),
    websites: draft.websites,
    videos: draft.videos,
    externalPages: filledRows(draft.externalPages).map((row) =>
      compact({ name: text(row.name), uid: text(row.uid), url: text(row.url) })
    ),
    relatedGames: Object.keys(relatedGames).length ? relatedGames : undefined,
    parentGameId: draft.parent?.id,
    cover: draft.cover.trim(),
    screenshots: draft.screenshots,
    artworks: draft.artworks,
    igdbId: toNumber(draft.igdbId.trim()),
    vndbId: draft.vndbId.trim(),
    hltbId: draft.hltbId.trim(),
    retroachievements: filledRows(draft.retroachievements).map((row) => ({
      gameId: toNumber(row.gameId),
      consoleId: toNumber(row.consoleId),
    })),
  });

  return payload as IGameRequestPayload;
};
