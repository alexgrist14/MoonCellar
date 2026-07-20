import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { IGameResponse } from "../lib/schemas/games.schema";

type IState = {
  games?: IGameResponse[];
  royalGames?: IGameResponse[];
  historyGames?: IGameResponse[];
};

type IAction = {
  setGames: (games: IGameResponse[]) => void;
  setRoyalGames: (royalGames: IGameResponse[]) => void;
  setHistoryGames: (historyGames: IGameResponse[]) => void;
  addRoyalGame: (game: IGameResponse) => void;
  addRoyalGames: (games: IGameResponse[]) => void;
  removeRoyalGame: (game: IGameResponse) => void;
  addHistoryGame: (game: IGameResponse) => void;
  removeHistoryGame: (game: IGameResponse) => void;
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
  addRoyalGames: (games) =>
    set((state: IState) => {
      const existingIds = new Set(
        (state.royalGames || []).map((royal) => royal._id)
      );
      const newGames = games.filter((game) => !existingIds.has(game._id));

      return {
        royalGames: [...(state.royalGames || []), ...newGames],
      };
    }),
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
