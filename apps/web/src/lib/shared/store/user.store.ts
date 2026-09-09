import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { IPlaythroughMinimal } from "../lib/schemas/playthroughs.schema";
import { IUserRating } from "../lib/schemas/user-ratings.schema";

type IState = {
  playthroughs?: IPlaythroughMinimal[];
  parsedPlaythroughs?: Record<string, IPlaythroughMinimal[]>;
  ratings?: IUserRating[];
  parsedRatings?: Record<string, number>;
};

type IAction = {
  setPlaythroughs: (playthroughs: IPlaythroughMinimal[] | undefined) => void;
  setRatings: (ratings: IUserRating[]) => void;
};

export const useUserStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      setPlaythroughs: (playthroughs) => {
        set({
          playthroughs,
          parsedPlaythroughs: playthroughs?.reduce(
            (acc: Record<string, IPlaythroughMinimal[]>, play) => {
              acc[play.gameId] = acc[play.gameId] || [];
              acc[play.gameId].push(play);

              return acc;
            },
            {}
          ),
        });
      },
      setRatings: (ratings) => {
        set({
          ratings,
          parsedRatings: ratings.reduce(
            (acc: Record<string, number>, rating: IUserRating) => {
              acc[rating.gameId] = rating.rating || 0;

              return acc;
            },
            {}
          ),
        });
      },
    }),
    { name: "user" }
  )
);
