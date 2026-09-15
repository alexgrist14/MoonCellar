import { create } from "zustand";
import { devtools } from "zustand/middleware";

type IState = {
  accountRoyalGames?: string[];
};

type IAction = {
  setAccountRoyalGames: (accountRoyalGames?: string[]) => void;
};

export const useRoyalStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      setAccountRoyalGames: (accountRoyalGames) => set({ accountRoyalGames }),
    }),
    { name: "royal" }
  )
);
