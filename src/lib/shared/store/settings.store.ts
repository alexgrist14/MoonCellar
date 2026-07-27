import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
type IState = {
  bgOpacity?: number;
  isMusicEnabled?: boolean;
  musicVolume?: number;
};

type IAction = {
  setBgOpacity: (bgOpacity: number) => void;
  setMusicEnabled: (isMusicEnabled: boolean) => void;
  setMusicVolume: (musicVolume: number) => void;
};

export const useSettingsStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isMusicEnabled: true,
        musicVolume: 1,
        setBgOpacity: (bgOpacity) => set({ bgOpacity }),
        setMusicEnabled: (isMusicEnabled) => set({ isMusicEnabled }),
        setMusicVolume: (musicVolume) => set({ musicVolume }),
      }),
      { name: "settings" }
    )
  )
);
