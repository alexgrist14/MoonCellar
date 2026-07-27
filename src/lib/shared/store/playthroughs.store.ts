import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { IPlaythrough } from "../lib/schemas/playthroughs.schema";

type IState = {
  playthroughs?: IPlaythrough[];
};

type IAction = {
  setPlaythroughs: (playthroughs: IPlaythrough[]) => void;
};

export const usePlaythroughsStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      setPlaythroughs: (playthroughs) => set({ playthroughs }),
    }),
    { name: "playthroughs" }
  )
);
