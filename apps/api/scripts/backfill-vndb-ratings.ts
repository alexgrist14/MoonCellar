import mongoose from "mongoose";
import { config } from "dotenv";
import {
  VNDB_PAGE_SIZE,
  VNDB_REQUEST_DELAY_MS,
} from "../src/module/games/constants/vndb";

config();

const VNDB_API_URL = "https://api.vndb.org/kana";
const APPLY = process.argv.includes("--apply");
const ALL = process.argv.includes("--all");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchRatings = async (vnIds: string[]) => {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${VNDB_API_URL}/vn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filters: ["or", ...vnIds.map((id) => ["id", "=", id])],
        fields: "id,rating,votecount",
        results: vnIds.length,
      }),
    }).catch((error: Error) => error);

    if (response instanceof Response && response.ok) {
      const { results } = (await response.json()) as {
        results: { id: string; rating: number | null; votecount: number }[];
      };

      return new Map(results.map((vn) => [vn.id, vn]));
    }

    if (attempt >= 4) {
      throw response instanceof Response
        ? new Error(
            `VNDB answered ${response.status}: ${await response.text()}`
          )
        : response;
    }

    const reason =
      response instanceof Response ? String(response.status) : response.message;
    console.log(`  retry ${attempt + 1}/4 after ${reason}`);
    await sleep(5000 * (attempt + 1));
  }
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: "games",
    autoIndex: false,
  });

  const games = mongoose.connection.collection("games");
  const filter = {
    "vndb.vnId": { $exists: true },
    ...(ALL ? {} : { "vndb.rating": { $exists: false } }),
  };
  const total = await games.countDocuments(filter);

  console.log(
    `games to fill: ${total} (${ALL ? "all VNDB games" : "only without vndb.rating"})`
  );

  if (!APPLY) {
    console.log("Dry run, pass --apply to write");
    await mongoose.disconnect();
    return;
  }

  const cursor = games.find(filter, {
    projection: { _id: 1, "vndb.vnId": 1 },
  });
  let batch: { _id: mongoose.Types.ObjectId; vnId: string }[] = [];
  let processed = 0;
  let updated = 0;
  let missing = 0;

  const flush = async () => {
    if (!batch.length) return;

    const ratings = await fetchRatings(batch.map(({ vnId }) => vnId));
    const ops = batch.flatMap(({ _id, vnId }) => {
      const vn = ratings.get(vnId);

      if (!vn) {
        missing++;
        return [];
      }

      return [
        {
          updateOne: {
            filter: { _id },
            update: {
              $set: {
                "vndb.rating": vn.rating ?? null,
                "vndb.votecount": vn.votecount ?? null,
              },
            },
          },
        },
      ];
    });

    if (ops.length) {
      const result = await games.bulkWrite(ops, { ordered: false });
      updated += result.modifiedCount;
    }

    processed += batch.length;
    batch = [];

    console.log(
      `progress: ${processed}/${total} games, ${updated} updated, ${missing} not found in VNDB`
    );
    await sleep(VNDB_REQUEST_DELAY_MS);
  };

  for await (const game of cursor) {
    batch.push({ _id: game._id, vnId: game.vndb.vnId });

    if (batch.length === VNDB_PAGE_SIZE) await flush();
  }

  await flush();

  console.log(
    `Finished: ${updated} game(s) updated, ${missing} VN(s) not returned by VNDB`
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
