import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { IGameResponse } from "@mooncellar/schemas";

type IState = {
  winner?: IGameResponse;
  segments?: string[];
  matchTotal?: number;
  royalRemainingIds?: string[];
  setWinner: (game: IGameResponse | undefined) => void;
  setSegments: (segments: string[]) => void;
  setMatchTotal: (matchTotal: number | undefined) => void;
  setRoyalRemainingIds: (ids: string[]) => void;
};

export const useWheelStore = create<IState>()(
  devtools(
    (set) => ({
      setWinner: (winner) => set({ winner }),
      setSegments: (segments) => set({ segments }),
      setMatchTotal: (matchTotal) => set({ matchTotal }),
      setRoyalRemainingIds: (royalRemainingIds) => set({ royalRemainingIds }),
    }),
    {
      name: "wheel",
    }
  )
);
