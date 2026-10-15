import type { Connection, Types } from "mongoose";

const USER_DATA_SOURCES = [
  { collection: "playthroughs", field: "gameId" },
  { collection: "ratings", field: "gameId" },
  { collection: "userlogs", field: "gameId" },
  { collection: "gamecomments", field: "gameId" },
  { collection: "customlists", field: "games.gameId" },
  { collection: "users", field: "favorites" },
  { collection: "users", field: "royalGames" },
];

export const findGamesWithUserData = async (
  connection: Connection,
  ids: Types.ObjectId[],
  batchSize: number
) => {
  const found = new Set<string>();

  for (let i = 0; i < ids.length; i += batchSize) {
    const chunk = ids.slice(i, i + batchSize);
    const values = [...chunk, ...chunk.map(String)];
    const results = await Promise.all(
      USER_DATA_SOURCES.map(({ collection, field }) =>
        connection
          .collection(collection)
          .distinct(field, { [field]: { $in: values } })
      )
    );

    results.flat().forEach((id) => found.add(String(id)));
  }

  return found;
};
