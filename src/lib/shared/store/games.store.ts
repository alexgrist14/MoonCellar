import { create } from "zustand";
import { IGDBGameMinimal } from "../types/igdb";
import { devtools, persist } from "zustand/middleware";

type IState = {
  games?: IGDBGameMinimal[];
  royalGames?: IGDBGameMinimal[];
  historyGames?: IGDBGameMinimal[];
};

type IAction = {
  setGames: (games: IGDBGameMinimal[]) => void;
  setRoyalGames: (royalGames: IGDBGameMinimal[]) => void;
  addRoyalGame: (game: IGDBGameMinimal) => void;
  removeRoyalGame: (game: IGDBGameMinimal) => void;
  setHistoryGames: (historyGames: IGDBGameMinimal[]) => void;
  addHistoryGame: (game: IGDBGameMinimal) => void;
  removeHistoryGame: (game: IGDBGameMinimal) => void;
};

const getActions = (set: any): IAction => ({
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
});

export const useGamesStore = create<IState & IAction>()(
  devtools(
    persist((set) => getActions(set), {
      name: "games",
    })
  )
);
