import mongoose from "mongoose";
import { config } from "dotenv";

config();

const APPLY = process.argv.includes("--apply");
const BATCH_SIZE = 1000;

const main = async () => {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING!, {
    dbName: "games",
    autoIndex: false,
  });

  const db = mongoose.connection.db!;
  const candidates = db.collection("vndbcandidates");
  const conflicts = db.collection("conflicts");

  console.log(`${APPLY ? "APPLY" : "DRY RUN"}: vndbcandidates -> conflicts`);

  const [total, alreadyMigrated] = await Promise.all([
    candidates.countDocuments(),
    conflicts.countDocuments({ source: "vndb" }),
  ]);

  console.log(
    `vndbcandidates: ${total}, conflicts with source vndb: ${alreadyMigrated}`
  );

  if (APPLY) {
    await conflicts.createIndex(
      { source: 1, externalId: 1 },
      { unique: true, background: true }
    );
    await conflicts.createIndex(
      { source: 1, status: 1, decision: 1 },
      { background: true }
    );
  }

  let ops: mongoose.mongo.AnyBulkWriteOperation[] = [];
  let seen = 0;
  let written = 0;

  const flush = async () => {
    if (APPLY && ops.length) {
      const result = await conflicts.bulkWrite(ops, { ordered: false });
      written += result.upsertedCount;
    }
    ops = [];
  };

  for await (const doc of candidates.find({})) {
    seen++;
    const { _id, vnId, vnName, ...rest } = doc;

    ops.push({
      updateOne: {
        filter: { source: "vndb", externalId: vnId },
        update: {
          $setOnInsert: {
            _id,
            source: "vndb",
            externalId: vnId,
            externalName: vnName,
            ...rest,
          },
        },
        upsert: true,
      },
    });

    if (ops.length >= BATCH_SIZE) await flush();
  }

  await flush();

  const byState = await candidates
    .aggregate([
      {
        $group: {
          _id: { status: "$status", decision: "$decision" },
          n: { $sum: 1 },
        },
      },
    ])
    .toArray();

  console.log(
    `read ${seen}, ${APPLY ? `inserted ${written}` : "nothing written"}`
  );
  console.log("by status/decision:", JSON.stringify(byState));

  if (APPLY) {
    console.log(
      `conflicts with source vndb now: ${await conflicts.countDocuments({ source: "vndb" })}`
    );
  }

  await mongoose.disconnect();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
