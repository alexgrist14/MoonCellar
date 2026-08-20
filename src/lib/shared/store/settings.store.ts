import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
type IState = {
  bgOpacity?: number;
  isMusicEnabled?: boolean;
  musicVolume?: number;
  isBounceBackEnabled?: boolean;
};

type IAction = {
  setBgOpacity: (bgOpacity: number) => void;
  setMusicEnabled: (isMusicEnabled: boolean) => void;
  setMusicVolume: (musicVolume: number) => void;
  setBounceBackEnabled: (isBounceBackEnabled: boolean) => void;
};

export const useSettingsStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isMusicEnabled: true,
        musicVolume: 1,
        isBounceBackEnabled: false,
        setBgOpacity: (bgOpacity) => set({ bgOpacity }),
        setMusicEnabled: (isMusicEnabled) => set({ isMusicEnabled }),
        setMusicVolume: (musicVolume) => set({ musicVolume }),
        setBounceBackEnabled: (isBounceBackEnabled) =>
          set({ isBounceBackEnabled }),
      }),
      { name: "settings" }
    )
  )
);
