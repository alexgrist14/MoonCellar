import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { IGameResponse } from "../lib/schemas/games.schema";

type IState = {
  winner?: IGameResponse;
  segments?: string[];
  setWinner: (game: IGameResponse | undefined) => void;
  setSegments: (segments: string[]) => void;
};

export const useWheelStore = create<IState>()(
  devtools(
    (set) => ({
      setWinner: (winner) => set({ winner }),
      setSegments: (segments) => set({ segments }),
    }),
    {
      name: "wheel",
    }
  )
);
