import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { IPlaythroughMinimal } from "../lib/schemas/playthroughs.schema";
import { IGamesRating } from "../types/user.type";

type IState = {
  playthroughs?: IPlaythroughMinimal[];
  ratings?: IGamesRating[];
};

type IAction = {
  setPlaythroughs: (playthroughs: IPlaythroughMinimal[]) => void;
  setRatings: (ratings: IGamesRating[]) => void;
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
