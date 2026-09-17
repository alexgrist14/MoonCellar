import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ISearchTab = "games" | "users" | "lists";

type IState = {
  tab: ISearchTab;
};

type IAction = {
  setTab: (tab: ISearchTab) => void;
};

const safeStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      return;
    }
  },
  removeItem: (name: string) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      return;
    }
  },
}));

export const useSearchStore = create<IState & IAction>()(
  persist(
    (set) => ({
      tab: "games",
      setTab: (tab) => set({ tab }),
    }),
    { name: "search", storage: safeStorage }
  )
);
