import mongoose from "mongoose";
import { config } from "dotenv";
import { buildAuthorization, getGame } from "@retroachievements/api";
import { RA_MAIN_USER_NAME } from "../src/shared/constants";
import { RA_GAMES_FETCH_DELAY_MS } from "../src/module/retroach/constants/sync";

config();

const APPLY = process.argv.includes("--apply");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: "games",
    autoIndex: false,
  });

  const conflicts = mongoose.connection.collection("conflicts");
  const filter = {
    source: "ra",
    externalData: { $type: "object" },
    "externalData.cover": { $exists: false },
  };
  const items = await conflicts
    .find(filter, { projection: { externalId: 1 } })
    .toArray();

  console.log(`RA conflicts without a cover: ${items.length}`);

  if (!APPLY) {
    console.log("Dry run, pass --apply to write");
    await mongoose.disconnect();
    return;
  }

  const authorization = buildAuthorization({
    username: RA_MAIN_USER_NAME,
    webApiKey: process.env.RETROACHIEVEMENTS_API_KEY,
  });
  let updated = 0;
  let missing = 0;
  let failed = 0;

  for (const [index, { _id, externalId }] of items.entries()) {
    try {
      const { imageBoxArt } = await getGame(authorization, {
        gameId: Number(externalId),
      });

      if (imageBoxArt) {
        await conflicts.updateOne(
          { _id },
          {
            $set: { "externalData.cover": imageBoxArt },
            $unset: { "externalData.imageIcon": "" },
          }
        );
        updated++;
      } else {
        missing++;
        console.log(`  ${externalId}: no box art`);
      }
    } catch (error) {
      failed++;
      console.log(`  ${externalId}: ${(error as Error).message}`);
    }

    if ((index + 1) % 50 === 0) {
      console.log(`${index + 1}/${items.length}`);
    }

    await sleep(RA_GAMES_FETCH_DELAY_MS);
  }

  console.log(
    `Done: ${updated} updated, ${missing} without box art, ${failed} failed`
  );
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
