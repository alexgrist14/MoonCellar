import { create } from "zustand";
import { devtools } from "zustand/middleware";

type IState = {
  isNavigating: boolean;
};

type IAction = {
  startNavigation: () => void;
  endNavigation: () => void;
};

export const useNavigationStore = create<IState & IAction>()(
  devtools((set) => ({
    isNavigating: false,
    startNavigation: () => set({ isNavigating: true }),
    endNavigation: () => set({ isNavigating: false }),
  }))
);

export const startNavigation = () =>
  useNavigationStore.getState().startNavigation();
