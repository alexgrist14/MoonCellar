import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { IPlaythroughMinimal } from "../lib/schemas/playthroughs.schema";
import { IUserRating } from "../lib/schemas/user-ratings.schema";

type IState = {
  playthroughs?: IPlaythroughMinimal[];
  ratings?: IUserRating[];
};

type IAction = {
  setPlaythroughs: (playthroughs: IPlaythroughMinimal[] | undefined) => void;
  setRatings: (ratings: IUserRating[]) => void;
};

export const useUserStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      setPlaythroughs: (playthroughs) => set({ playthroughs }),
      setRatings: (ratings) => set({ ratings }),
    }),
    { name: "user" }
  )
);
