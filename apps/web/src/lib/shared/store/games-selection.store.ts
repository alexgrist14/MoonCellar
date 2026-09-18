import { create } from "zustand";
import { devtools } from "zustand/middleware";

type IState = {
  isSelectMode: boolean;
  selected: string[];
  setSelectMode: (isSelectMode: boolean) => void;
  toggleGame: (gameId: string) => void;
  setSelected: (gameIds: string[]) => void;
  clearSelected: () => void;
};

export const useGamesSelectionStore = create<IState>()(
  devtools(
    (set) => ({
      isSelectMode: false,
      selected: [],
      setSelectMode: (isSelectMode) =>
        set(isSelectMode ? { isSelectMode } : { isSelectMode, selected: [] }),
      toggleGame: (gameId) =>
        set((state) => ({
          selected: state.selected.includes(gameId)
            ? state.selected.filter((id) => id !== gameId)
            : [...state.selected, gameId],
        })),
      setSelected: (selected) => set({ selected }),
      clearSelected: () => set({ selected: [] }),
    }),
    { name: "games-selection" }
  )
);
