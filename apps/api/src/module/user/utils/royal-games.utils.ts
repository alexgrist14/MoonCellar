import type { Types, UpdateWithAggregationPipeline } from "mongoose";
import type { IRoyalGamesPosition } from "@mooncellar/schemas";

const currentRoyalGames = { $ifNull: ["$royalGames", []] };

export const buildAddRoyalGamesUpdate = (
  gameIds: Types.ObjectId[],
  position: IRoyalGamesPosition,
  limit: number
): UpdateWithAggregationPipeline => {
  const freshGames = {
    $filter: {
      input: { $literal: gameIds },
      cond: { $not: [{ $in: ["$$this", currentRoyalGames] }] },
    },
  };
  const freeSlots = { $subtract: [limit, { $size: currentRoyalGames }] };
  const acceptedGames = {
    $cond: [{ $gt: [freeSlots, 0] }, { $slice: [freshGames, freeSlots] }, []],
  };

  return [
    {
      $set: {
        royalGames: {
          $concatArrays:
            position === "start"
              ? [acceptedGames, currentRoyalGames]
              : [currentRoyalGames, acceptedGames],
        },
      },
    },
  ];
};

export const buildRemoveRoyalGamesUpdate = (
  gameIds: Types.ObjectId[]
): UpdateWithAggregationPipeline => [
  {
    $set: {
      royalGames: {
        $filter: {
          input: currentRoyalGames,
          cond: { $not: [{ $in: ["$$this", { $literal: gameIds }] }] },
        },
      },
    },
  },
];
