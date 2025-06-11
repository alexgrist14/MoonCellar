import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { IPlaythroughMinimal } from "../lib/schemas/playthroughs.schema";

type IState = {
  playthroughs?: IPlaythroughMinimal[];
};

type IAction = {
  setPlaythroughs: (playthroughs: IPlaythroughMinimal[]) => void;
};

export const useUserStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        setPlaythroughs: (playthroughs) => set({ playthroughs }),
      }),
      { name: "user" }
    )
  )
);
