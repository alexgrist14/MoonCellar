import { create } from "zustand";
import { IGDBGameMinimal } from "../types/igdb.type";
import { devtools, persist } from "zustand/middleware";

type IState = {
  winner?: IGDBGameMinimal;
  games?: IGDBGameMinimal[];
  royalGames?: IGDBGameMinimal[];
  historyGames?: IGDBGameMinimal[];
  segments?: string[];
};

type IAction = {
  setWinner: (game: IGDBGameMinimal | undefined) => void;
  setGames: (games: IGDBGameMinimal[]) => void;
  setRoyalGames: (royalGames: IGDBGameMinimal[]) => void;
  addRoyalGame: (game: IGDBGameMinimal) => void;
  removeRoyalGame: (game: IGDBGameMinimal) => void;
  setHistoryGames: (historyGames: IGDBGameMinimal[]) => void;
  addHistoryGame: (game: IGDBGameMinimal) => void;
  removeHistoryGame: (game: IGDBGameMinimal) => void;
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
