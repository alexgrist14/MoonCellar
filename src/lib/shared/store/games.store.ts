import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { IGameResponse } from "../lib/schemas/games.schema";

type IState = {
  winner?: IGameResponse;
  games?: IGameResponse[];
  royalGames?: IGameResponse[];
  historyGames?: IGameResponse[];
  segments?: string[];
};

type IAction = {
  setWinner: (game: IGameResponse | undefined) => void;
  setGames: (games: IGameResponse[]) => void;
  setRoyalGames: (royalGames: IGameResponse[]) => void;
  addRoyalGame: (game: IGameResponse) => void;
  removeRoyalGame: (game: IGameResponse) => void;
  setHistoryGames: (historyGames: IGameResponse[]) => void;
  addHistoryGame: (game: IGameResponse) => void;
  removeHistoryGame: (game: IGameResponse) => void;
  setSegments: (segments: string[]) => void;
};

const getActions = (set: any): IAction => ({
  setWinner: (winner) => set({ winner }),
  setGames: (games) => set({ games }),
  setRoyalGames: (royalGames) => set({ royalGames }),
  addRoyalGame: (game) =>
    set((state: IState) => ({
      royalGames: [
        game,
        ...(!!state.royalGames?.length ? state.royalGames : []),
      ],
    })),
  removeRoyalGame: (game) =>
    set((state: IState) => ({
      royalGames: !!state.royalGames?.length
        ? state.royalGames.filter((royal) => royal._id !== game._id)
        : undefined,
    })),
  setHistoryGames: (historyGames) => set({ historyGames }),
  addHistoryGame: (game) =>
    set((state: IState) => ({
      historyGames: [
        game,
        ...(!!state.historyGames?.length ? state.historyGames : []),
      ],
    })),
  removeHistoryGame: (game) =>
    set((state: IState) => ({
      historyGames: !!state.historyGames?.length
        ? state.historyGames.filter((royal) => royal._id !== game._id)
        : undefined,
    })),
  setSegments: (segments) => set({ segments }),
});

export const useGamesStore = create<IState & IAction>()(
  devtools(
    persist((set) => getActions(set), {
      name: "games",
    })
  )
);
