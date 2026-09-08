import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
type IState = {
  bgOpacityPreview?: number;
  isMusicEnabled?: boolean;
  musicVolume?: number;
  isBounceBackEnabled?: boolean;
};

type IAction = {
  setBgOpacityPreview: (bgOpacityPreview?: number) => void;
  setMusicEnabled: (isMusicEnabled: boolean) => void;
  setMusicVolume: (musicVolume: number) => void;
  setBounceBackEnabled: (isBounceBackEnabled: boolean) => void;
};

export const useSettingsStore = create<IState & IAction>()(
  devtools(
    persist(
      (set) => ({
        isMusicEnabled: false,
        musicVolume: 1,
        isBounceBackEnabled: false,
        setBgOpacityPreview: (bgOpacityPreview) => set({ bgOpacityPreview }),
        setMusicEnabled: (isMusicEnabled) => set({ isMusicEnabled }),
        setMusicVolume: (musicVolume) => set({ musicVolume }),
        setBounceBackEnabled: (isBounceBackEnabled) =>
          set({ isBounceBackEnabled }),
      }),
      {
        name: "settings",
        partialize: ({ bgOpacityPreview, ...state }) => state,
      }
    )
  )
);
