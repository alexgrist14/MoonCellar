import mongoose from "mongoose";
import { config } from "dotenv";
import {
  getS3CdnUrl,
  LEGACY_BUCKET_PREFIX,
  resolveS3Folder,
} from "../src/shared/s3";

config();

const APPLY = process.argv.includes("--apply");
const BATCH_SIZE = 1000;

const TARGETS = [
  { collection: "games", fields: ["cover", "screenshots", "artworks"] },
  { collection: "characters", fields: ["mugShot"] },
  { collection: "users", fields: ["avatar", "background"] },
  { collection: "playthroughs", fields: ["comment"] },
  { collection: "userlogs", fields: ["text"] },
];

const LEGACY_URL =
  /https?:\/\/(?:s3\.regru\.cloud\/mooncellar-([a-z0-9-]+)|mooncellar-([a-z0-9-]+)\.s3\.regru\.cloud)\//gi;
const LEGACY_URL_ONLY = /https?:\/\/[^\s"'<>]*regru\.cloud[^\s"'<>]*/i;

const cdnUrl = getS3CdnUrl();
const unknownBuckets = new Map<string, number>();

const rewrite = (value: string) =>
  value.replace(LEGACY_URL, (match, pathBucket, hostBucket) => {
    const bucket = `${LEGACY_BUCKET_PREFIX}${pathBucket ?? hostBucket}`;
    const folder = resolveS3Folder(bucket);

    if (!folder) {
      unknownBuckets.set(bucket, (unknownBuckets.get(bucket) ?? 0) + 1);
      return match;
    }

    return `${cdnUrl}/${folder}/`;
  });

const rewriteValue = (value: unknown): unknown => {
  if (typeof value === "string") return rewrite(value);
  if (Array.isArray(value)) return value.map(rewriteValue);
  return value;
};

const firstLegacyUrl = (value: unknown): string | undefined => {
  const values = Array.isArray(value) ? value : [value];

  for (const item of values) {
    if (typeof item !== "string") continue;
    const match = item.match(LEGACY_URL_ONLY);
    if (match) return match[0];
  }

  return undefined;
};

async function main() {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING!, {
    dbName: "games",
  });

  const db = mongoose.connection.db!;

  console.log(
    `${APPLY ? "APPLY" : "DRY RUN"}: legacy regru URLs -> ${cdnUrl}/<folder>/`
  );

  for (const { collection, fields } of TARGETS) {
    const filter = {
      $or: fields.map((field) => ({ [field]: { $regex: "regru\\.cloud" } })),
    };
    const cursor = db
      .collection(collection)
      .find(filter, {
        projection: Object.fromEntries(fields.map((field) => [field, 1])),
      })
      .batchSize(BATCH_SIZE);

    let matched = 0;
    let changed = 0;
    const fieldCounts: Record<string, number> = {};
    const samples: string[] = [];
    let ops: mongoose.mongo.AnyBulkWriteOperation[] = [];

    for await (const doc of cursor) {
      matched++;
      const set: Record<string, unknown> = {};

      for (const field of fields) {
        const before = doc[field];
        if (before === undefined || before === null) continue;

        const after = rewriteValue(before);
        if (JSON.stringify(after) === JSON.stringify(before)) continue;

        set[field] = after;
        fieldCounts[field] = (fieldCounts[field] ?? 0) + 1;

        const url = firstLegacyUrl(before);
        if (url && samples.length < 2) {
          samples.push(`${field}: ${url}\n      -> ${rewrite(url)}`);
        }
      }

      if (!Object.keys(set).length) continue;

      changed++;

      if (APPLY) {
        ops.push({ updateOne: { filter: { _id: doc._id }, update: { $set: set } } });

        if (ops.length >= BATCH_SIZE) {
          await db.collection(collection).bulkWrite(ops, { ordered: false });
          ops = [];
        }
      }
    }

    if (APPLY && ops.length) {
      await db.collection(collection).bulkWrite(ops, { ordered: false });
    }

    console.log(
      `\n== ${collection}: ${matched} matched, ${changed} ${APPLY ? "updated" : "would change"}`
    );
    for (const [field, count] of Object.entries(fieldCounts)) {
      console.log(`   ${field}: ${count}`);
    }
    for (const sample of samples) console.log(`   ${sample}`);
  }

  if (unknownBuckets.size) {
    console.log("\nLeft untouched, no folder mapping for:");
    for (const [bucket, count] of unknownBuckets) {
      console.log(`   ${bucket}: ${count}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
