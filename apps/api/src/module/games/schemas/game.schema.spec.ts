import mongoose from "mongoose";
import { GameDatabaseSchema } from "./game.schema";

const Games = mongoose.model("GameSchemaSpec", GameDatabaseSchema);

const runUpdateHooks = async (update: Record<string, unknown>) => {
  const query = Games.updateOne({}, update);

  const hooks = (
    GameDatabaseSchema as unknown as {
      s: {
        hooks: {
          execPre: (
            name: string,
            context: unknown,
            args: unknown[],
            callback: (error?: Error) => void
          ) => void;
        };
      };
    }
  ).s.hooks;

  await new Promise<void>((resolve, reject) =>
    hooks.execPre("updateOne", query, [], (error) =>
      error ? reject(error) : resolve()
    )
  );

  return query.getUpdate() as Record<string, Record<string, unknown>>;
};

describe("Game schema name hook", () => {
  it("sets nameNormalized for a normal title", async () => {
    const update = await runUpdateHooks({ $set: { name: "Doom" } });

    expect(update.$set.nameNormalized).toBe("doom");
  });

  it("never sets and unsets nameNormalized together for a symbol-only title", async () => {
    const update = await runUpdateHooks({
      $set: { name: "***", nameNormalized: "" },
    });

    expect(update.$unset).toEqual({ nameNormalized: "" });
    expect(update.$set).not.toHaveProperty("nameNormalized");
  });
});
