import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
type IState = {
  bgOpacity?: number;
};

type IAction = {
  setBgOpacity: (bgOpacity: number) => void;
};

export const useSettingsStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        setBgOpacity: (bgOpacity) => set({ bgOpacity }),
      }),
      { name: "settings" }
    )
  )
);
