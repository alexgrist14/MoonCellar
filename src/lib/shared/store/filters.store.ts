import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type IState = {
  isExcludeHistory: boolean;
  setExcludeHistory: (isExcludeHistory: boolean) => void;
};

export const useFiltersStore = create<IState>()(
  devtools(
    persist(
      (set) => ({
        isExcludeHistory: false,
        setExcludeHistory: (isExcludeHistory) => set({ isExcludeHistory }),
      }),
      { name: "filters" }
    )
  )
);
