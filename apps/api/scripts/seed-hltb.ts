import mongoose from "mongoose";
import { config } from "dotenv";
import { HowLongToBeatService } from "howlongtobeat-ts";
import {
  buildHltbSearchQueries,
  buildPlatformKeySet,
  hasHltbTimes,
  HltbMatchContext,
  HltbSearchEntry,
  mapHltbEntryToField,
  selectHltbMatch,
} from "../src/module/games/utils/hltb.utils";

config();

type SeedReleaseDate = { year?: number | null };

type SeedGameDoc = {
  _id: unknown;
  name: string;
  slug: string;
  platformIds?: unknown[];
  release_dates?: SeedReleaseDate[];
  first_release?: number | null;
};

const gameSchema = new mongoose.Schema({}, { strict: false, collection: "games" });
const Game = mongoose.model("Game", gameSchema);
const platformSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "platforms" }
);
const Platform = mongoose.model("Platform", platformSchema);

async function main() {
  const slug = process.argv[2] || "elden-ring";

  await mongoose.connect(process.env.MONGO_CONNECTION_STRING!, {
    dbName: "games",
  });

  const game = await Game.findOne({ slug })
    .select("name slug hltb platformIds release_dates first_release")
    .lean<SeedGameDoc>();

  if (!game) {
    throw new Error(`Game not found: ${slug}`);
  }

  const platformDocs = await Platform.find({ _id: { $in: game.platformIds ?? [] } })
    .select("name")
    .lean<{ name?: string }[]>();
  const platformNames = platformDocs
    .map((doc) => doc?.name)
    .filter((name): name is string => !!name);

  const years = new Set<number>();
  for (const release of game.release_dates ?? []) {
    if (release?.year) {
      years.add(release.year);
    }
  }
  if (game.first_release) {
    years.add(new Date(game.first_release * 1000).getUTCFullYear());
  }

  const ctx: HltbMatchContext = {
    name: game.name,
    platformKeys: buildPlatformKeySet(platformNames),
    years,
  };

  const hltbClient = new HowLongToBeatService();
  const pool = new Map<number, HltbSearchEntry>();

  for (const query of buildHltbSearchQueries(game.name)) {
    const response = await hltbClient.search(query);
    if (!response.success) {
      continue;
    }
    for (const entry of response.data ?? []) {
      if (!pool.has(entry.id)) {
        pool.set(entry.id, {
          id: entry.id,
          name: entry.name,
          mainTime: entry.mainTime,
          mainExtraTime: entry.mainExtraTime,
          completionistTime: entry.completionistTime,
          similarity: entry.similarity,
          platforms: entry.platforms,
          releaseYear: entry.releaseYear,
        });
      }
    }
  }

  const match = selectHltbMatch([...pool.values()], ctx);

  if (!match) {
    throw new Error(`No verified HLTB match for ${game.name}`);
  }

  console.log(`Matched "${match.entry.name}" (id=${match.entry.id}) via ${match.tier}`);

  const hltb = mapHltbEntryToField(match.entry);

  if (!hasHltbTimes(hltb)) {
    throw new Error(`HLTB match has no times for ${game.name}`);
  }

  await Game.updateOne(
    { slug },
    { $set: { hltb, updatedAt: new Date().toISOString() } }
  );

  const updated = await Game.findOne({ slug }).select("name slug hltb").lean();

  console.log(JSON.stringify(updated, null, 2));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
