import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import mongoose from "mongoose";
import { config } from "dotenv";
import { buildAuthorization, getGameList } from "@retroachievements/api";
import type { IRetroachievementsField } from "@mooncellar/schemas";
import { RA_MAIN_USER_NAME } from "../src/shared/constants";
import { RA_GAMES_FETCH_DELAY_MS } from "../src/module/retroach/constants/sync";
import {
  matchRaSets,
  pickRaMatchesByTitle,
  type TRaPicker,
  type TRaSet,
} from "../src/module/retroach/utils/retroach.utils";
import {
  buildRaPlatformMaps,
  createRaEnginePicker,
} from "../src/module/retroach/utils/ra-match.utils";
import { HltbService } from "../src/module/games/services/hltb.service";
import {
  buildHltbCatalog,
  buildHltbMatchContext,
  decideHltbMatch,
  findCatalogCandidates,
  getEditionParentId,
  type HltbSearchEntry,
} from "../src/module/games/utils/hltb.utils";

config();

const [mode] = process.argv.slice(2);
const REFRESH = process.argv.includes("--refresh");
const LIMIT = Number(process.argv[process.argv.indexOf("--limit") + 1]) || 0;
const SAMPLES = 15;
const CACHE_DIR = join(__dirname, ".dry-run");

type TRaMaps = ReturnType<typeof buildRaPlatformMaps>;

const RA_PICKERS: Record<string, (maps: TRaMaps) => TRaPicker> = {
  fuzzysort: () => pickRaMatchesByTitle,
  "engine-plain": (maps) =>
    createRaEnginePicker({ ...maps, foldNumerals: false }),
  engine: (maps) => createRaEnginePicker(maps),
};

const HLTB_DECIDERS: Record<string, typeof decideHltbMatch> = {
  current: decideHltbMatch,
};

type TDoc = Record<string, any>;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const cached = async <T>(file: string, load: () => Promise<T>): Promise<T> => {
  const path = join(CACHE_DIR, file);

  if (!REFRESH && existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  }

  const data = await load();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(path, JSON.stringify(data));

  return data;
};

const report = (name: string, sections: Record<string, string[]>) => {
  console.log(`\n=== ${name}`);
  for (const [label, items] of Object.entries(sections)) {
    console.log(`${label}: ${items.length}`);
    for (const item of items.slice(0, SAMPLES)) console.log(`  ${item}`);
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(
    join(CACHE_DIR, `report-${name}.json`),
    JSON.stringify(sections, null, 2)
  );
};

const winnerIds = (conflict: TDoc): string[] =>
  (conflict.winners?.length ? conflict.winners : [conflict.winner])
    .filter(Boolean)
    .map(String);

const runRa = async (db: mongoose.mongo.Db) => {
  const allPlatforms = await db
    .collection("platforms")
    .find({}, { projection: { raId: 1, slug: 1 } })
    .toArray();
  const platforms = allPlatforms.filter(({ raId }) => raId != null);
  const maps = buildRaPlatformMaps(allPlatforms as never[]);
  const consoleIds = [...new Set(platforms.map(({ raId }) => raId as number))];

  const raGames = await cached<TRaSet[]>("ra-sets.json", async () => {
    const authorization = buildAuthorization({
      username: RA_MAIN_USER_NAME,
      webApiKey: process.env.RETROACHIEVEMENTS_API_KEY,
    });
    const sets: TRaSet[] = [];

    for (const consoleId of consoleIds) {
      sets.push(
        ...(await getGameList(authorization, {
          consoleId,
          shouldOnlyRetrieveGamesWithAchievements: true,
        }))
      );
      console.log(`RA console ${consoleId}: ${sets.length} sets so far`);
      await sleep(RA_GAMES_FETCH_DELAY_MS);
    }

    return sets;
  });

  const games = (await db
    .collection("games")
    .find(
      {
        $or: [
          { platformIds: { $in: platforms.map(({ _id }) => _id) } },
          { "retroachievements.0": { $exists: true } },
        ],
      },
      {
        projection: {
          name: 1,
          platformIds: 1,
          retroachievements: 1,
          alternative_names: 1,
          type: 1,
        },
      }
    )
    .toArray()) as TDoc[];
  const names = new Map(games.map((game) => [String(game._id), game.name]));
  const conflicts = await db
    .collection("conflicts")
    .find(
      { source: "ra" },
      { projection: { externalId: 1, status: 1, winner: 1, winners: 1 } }
    )
    .toArray();
  const resolutions = new Map(
    conflicts.map((conflict) => [
      conflict.externalId as string,
      { status: conflict.status as string, winners: winnerIds(conflict) },
    ])
  );
  const titles = new Map(raGames.map((set) => [set.id, set.title]));
  const linksBySet = (byGame: Map<string, IRetroachievementsField[]>) => {
    const links = new Map<number, string[]>();
    for (const [gameId, sets] of byGame) {
      for (const { gameId: raId } of sets) {
        links.set(raId, [...(links.get(raId) ?? []), gameId].sort());
      }
    }
    return links;
  };
  const stored = new Map(
    games
      .filter((game) => game.retroachievements?.length)
      .map((game) => [String(game._id), game.retroachievements])
  );
  const before = linksBySet(stored);

  console.log(
    `RA: ${raGames.length} sets on ${consoleIds.length} consoles, ${games.length} games, ${stored.size} linked`
  );

  for (const [name, createPicker] of Object.entries(RA_PICKERS)) {
    const pick = createPicker(maps);
    const startedAt = Date.now();
    const { gameIds, ambiguous } = matchRaSets({
      raGames,
      games: games as never[],
      platforms,
      resolutions,
      pick,
    });
    const afterByGame = new Map(stored);
    for (const [gameId, sets] of Object.entries(gameIds)) {
      afterByGame.set(gameId, sets);
    }
    const linked = new Set(
      Object.values(gameIds).flatMap((sets) => sets.map(({ gameId }) => gameId))
    );
    for (const [gameId, sets] of afterByGame) {
      if (gameIds[gameId]) continue;
      afterByGame.set(
        gameId,
        sets.filter(({ gameId: raId }) => !linked.has(raId))
      );
    }
    const after = linksBySet(afterByGame);
    const label = (raId: number, ids: string[] = []) =>
      `${raId} "${titles.get(raId) ?? "?"}" → ${ids.map((id) => names.get(id) ?? id).join(" | ") || "nothing"}`;
    const sections: Record<string, string[]> = {
      added: [],
      removed: [],
      moved: [],
      "new conflicts": [],
    };

    for (const raId of new Set([...before.keys(), ...after.keys()])) {
      const was = before.get(raId) ?? [];
      const now = after.get(raId) ?? [];
      if (was.join() === now.join()) continue;
      const key = !was.length ? "added" : !now.length ? "removed" : "moved";
      sections[key].push(
        key === "moved"
          ? `${label(raId, was)}  ⇒  ${label(raId, now)}`
          : label(raId, now.length ? now : was)
      );
    }

    const unsure = new Set(ambiguous.map(({ raGame }) => String(raGame.id)));
    for (const raId of unsure) {
      if (!resolutions.has(raId))
        sections["new conflicts"].push(label(Number(raId)));
    }

    console.log(`${name}: ${((Date.now() - startedAt) / 1000).toFixed(1)} s`);
    report(`ra-${name}`, sections);
  }
};

const runHltb = async (db: mongoose.mongo.Db) => {
  const entries = await cached<HltbSearchEntry[]>("hltb-catalog.json", () => {
    const logger = {
      setContext() {},
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug() {},
    };
    const service = new HltbService(
      null as never,
      null as never,
      logger as never,
      null as never,
      null as never,
      null as never
    );

    return (
      service as unknown as { downloadCatalog(): Promise<HltbSearchEntry[]> }
    ).downloadCatalog();
  });
  const catalog = buildHltbCatalog(entries);
  const platformNames = new Map(
    (
      await db
        .collection("platforms")
        .find({}, { projection: { name: 1 } })
        .toArray()
    ).map((platform) => [String(platform._id), platform.name as string])
  );
  const linkedHltbIds = new Map(
    (
      await db
        .collection("games")
        .find(
          { "hltb.hltbId": { $exists: true } },
          { projection: { "hltb.hltbId": 1 } }
        )
        .toArray()
    ).map((game) => [String(game._id), game.hltb.hltbId as string])
  );
  const entriesByGame = new Map<string, string[]>();
  const hltbConflicts = await db
    .collection("conflicts")
    .find(
      { source: "hltb", status: "pending" },
      {
        projection: {
          externalId: 1,
          entries: { id: 1 },
          candidates: { gameId: 1 },
        },
      }
    )
    .toArray();
  for (const conflict of hltbConflicts) {
    const candidates = (conflict.candidates ?? []) as { gameId: unknown }[];
    const pairs = candidates.length
      ? candidates.map(({ gameId }) => [
          String(gameId),
          conflict.externalId as string,
        ])
      : ((conflict.entries ?? []) as { id: string }[]).map(({ id }) => [
          conflict.externalId as string,
          id,
        ]);
    for (const [gameId, entryId] of pairs) {
      entriesByGame.set(gameId, [
        ...(entriesByGame.get(gameId) ?? []),
        entryId,
      ]);
    }
  }
  const pending = new Map(
    [...entriesByGame].map(([gameId, ids]) => [gameId, ids.sort().join()])
  );
  const names = new Map(entries.map((entry) => [String(entry.id), entry.name]));
  const describe = (ids: string) =>
    ids
      .split(",")
      .map((id) => names.get(id) ?? id)
      .join(" | ");
  const results = Object.fromEntries(
    Object.keys(HLTB_DECIDERS).map((name) => [
      name,
      {
        linked: [],
        "new conflicts": [],
        "changed conflicts": [],
        "conflicts gone": [],
      } as Record<string, string[]>,
    ])
  );
  let processed = 0;

  console.log(
    `HLTB: ${entries.length} catalogue entries, ${linkedHltbIds.size} linked games, ${pending.size} pending conflicts`
  );

  const cursor = db
    .collection("games")
    .find(
      { "hltb.hltbId": { $exists: false } },
      {
        projection: {
          name: 1,
          type: 1,
          "relatedGames.version_parent": 1,
          platformIds: 1,
          release_dates: 1,
          first_release: 1,
        },
      }
    )
    .limit(LIMIT);

  for await (const game of cursor) {
    processed += 1;
    const id = String(game._id);
    const pool = findCatalogCandidates(catalog, game.name);
    const ctx = buildHltbMatchContext(game as never, platformNames);
    const parentHltbId = linkedHltbIds.get(
      getEditionParentId(game as never) ?? ""
    );
    const parentEntry = parentHltbId
      ? catalog.byId.get(Number(parentHltbId))
      : null;
    const was = pending.get(id);

    for (const [name, decide] of Object.entries(HLTB_DECIDERS)) {
      const { entry, conflict } = decide(pool, ctx, parentEntry);
      const now = conflict?.entries
        .map(({ id: entryId }) => String(entryId))
        .sort()
        .join();
      const sections = results[name];

      if (entry)
        sections.linked.push(`${game.name} → ${entry.name} (${entry.id})`);
      if (now && !was)
        sections["new conflicts"].push(`${game.name} → ${describe(now)}`);
      if (now && was && now !== was)
        sections["changed conflicts"].push(
          `${game.name}: ${describe(was)}  ⇒  ${describe(now)}`
        );
      if (!now && was)
        sections["conflicts gone"].push(`${game.name} ✗ ${describe(was)}`);
    }

    if (processed % 50000 === 0) console.log(`HLTB: ${processed} games`);
  }

  console.log(`HLTB: ${processed} games without a link`);
  for (const [name, sections] of Object.entries(results))
    report(`hltb-${name}`, sections);
};

const run = async () => {
  if (mode !== "ra" && mode !== "hltb") {
    console.log(
      "Usage: bun scripts/matching-dry-run.ts <ra|hltb> [--refresh] [--limit N]"
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: "games",
    autoIndex: false,
    socketTimeoutMS: 900_000,
    heartbeatFrequencyMS: 60_000,
  });

  await (mode === "ra" ? runRa : runHltb)(mongoose.connection.db!);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
