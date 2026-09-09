import mongoose from "mongoose";
import { config } from "dotenv";
import {
  categories,
  categoryTypeNames,
} from "../src/module/igdb/constants/common";

config();

const gameSchema = new mongoose.Schema({}, { strict: false, collection: "games" });
const Game = mongoose.model("Game", gameSchema);

type SeedGameDoc = {
  _id: unknown;
  name: string;
  type: string;
};

async function main() {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING!, {
    dbName: "games",
  });

  const games = await Game.find({
    type: { $in: [...Object.keys(categories), /^[0-9]+$/] },
  })
    .select("name type")
    .lean<SeedGameDoc[]>();

  console.log(`Found ${games.length} games with a raw category id/key type`);

  for (const game of games) {
    const categoryId = /^[0-9]+$/.test(game.type)
      ? Number(game.type)
      : categories[game.type as keyof typeof categories];
    const name = categoryTypeNames[categoryId];

    if (!name) {
      console.warn(`No category name for type="${game.type}", skipping "${game.name}"`);
      continue;
    }

    await Game.updateOne(
      { _id: game._id },
      { $set: { type: name, updatedAt: new Date().toISOString() } }
    );

    console.log(`${game.name}: ${game.type} -> ${name}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
