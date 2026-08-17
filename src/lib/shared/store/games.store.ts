import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { IGameResponse } from "../lib/schemas/games.schema";

type IState = {
  games?: IGameResponse[];
  royalGames?: string[];
  historyGames?: IGameResponse[];
};

type IAction = {
  setGames: (games: IGameResponse[]) => void;
  setRoyalGames: (royalGames: string[]) => void;
  setHistoryGames: (historyGames: IGameResponse[]) => void;
  addRoyalGame: (gameId: string) => void;
  addRoyalGames: (gameIds: string[]) => void;
  removeRoyalGame: (gameId: string) => void;
  addHistoryGame: (game: IGameResponse) => void;
  removeHistoryGame: (game: IGameResponse) => void;
};

const getActions = (set: any): IAction => ({
  setGames: (games) => set({ games }),
  setRoyalGames: (royalGames) => set({ royalGames }),
  addRoyalGame: (gameId) =>
    set((state: IState) => ({
      royalGames: [
        gameId,
        ...(!!state.royalGames?.length ? state.royalGames : []),
      ],
    })),
  addRoyalGames: (gameIds) =>
    set((state: IState) => {
      const existingIds = new Set(state.royalGames || []);
      const newIds = gameIds.filter((id) => !existingIds.has(id));

      return {
        royalGames: [...(state.royalGames || []), ...newIds],
      };
    }),
  removeRoyalGame: (gameId) =>
    set((state: IState) => ({
      royalGames: !!state.royalGames?.length
        ? state.royalGames.filter((id) => id !== gameId)
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
      version: 1,
      migrate: (persistedState: any) => {
        if (persistedState?.royalGames?.length) {
          persistedState.royalGames = persistedState.royalGames.map(
            (royal: any) => (typeof royal === "string" ? royal : royal._id)
          );
        }

        return persistedState;
      },
    })
  )
);
