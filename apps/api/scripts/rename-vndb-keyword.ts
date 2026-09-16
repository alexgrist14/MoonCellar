import mongoose from "mongoose";
import { config } from "dotenv";
import { VNDB_EXPLICIT_IMAGES_KEYWORD } from "../src/module/games/constants/vndb";

config();

const APPLY = process.argv.includes("--apply");

const arg = (name: string) =>
  process.argv
    .find((value) => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3);

const FROM = arg("from") ?? "18+ images";
const TO = arg("to") ?? VNDB_EXPLICIT_IMAGES_KEYWORD;

const run = async () => {
  if (!FROM || !TO) throw new Error("Both --from and --to must be non-empty");

  if (FROM === TO) {
    console.log(`Nothing to do: games already use "${TO}"`);
    return;
  }

  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: "games",
    autoIndex: false,
  });

  const games = mongoose.connection.collection("games");
  const matched = await games.countDocuments({ keywords: FROM });
  const both = await games.countDocuments({ keywords: { $all: [FROM, TO] } });

  console.log(
    `games with "${FROM}": ${matched}, of them already carrying "${TO}": ${both}`
  );

  if (!APPLY) {
    console.log("Dry run, pass --apply to write");
    await mongoose.disconnect();
    return;
  }

  const pulled = await games.updateMany(
    { keywords: { $all: [FROM, TO] } },
    { $pull: { keywords: FROM } }
  );
  const renamed = await games.updateMany(
    { keywords: FROM },
    { $set: { "keywords.$[keyword]": TO } },
    { arrayFilters: [{ keyword: FROM }] }
  );

  console.log(
    `Renamed in ${renamed.modifiedCount} game(s), dropped the duplicate in ${pulled.modifiedCount} game(s)`
  );
  console.log(
    `games with "${FROM}" left: ${await games.countDocuments({ keywords: FROM })}`
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
