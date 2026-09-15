import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

const RECENT_EMOJIS_LIMIT = 24;

type IState = {
  bgOpacityPreview?: number;
  isMusicEnabled?: boolean;
  musicVolume?: number;
  isBounceBackEnabled?: boolean;
  recentEmojis?: string[];
};

type IAction = {
  setBgOpacityPreview: (bgOpacityPreview?: number) => void;
  setMusicEnabled: (isMusicEnabled: boolean) => void;
  setMusicVolume: (musicVolume: number) => void;
  setBounceBackEnabled: (isBounceBackEnabled: boolean) => void;
  addRecentEmoji: (emoji: string) => void;
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
        addRecentEmoji: (emoji) =>
          set((state) => ({
            recentEmojis: [
              emoji,
              ...(state.recentEmojis ?? []).filter((item) => item !== emoji),
            ].slice(0, RECENT_EMOJIS_LIMIT),
          })),
      }),
      {
        name: "settings",
        partialize: ({ bgOpacityPreview, ...state }) => state,
      }
    )
  )
);
