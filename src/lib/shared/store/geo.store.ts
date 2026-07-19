import { create } from "zustand";
import { devtools } from "zustand/middleware";

type IState = {
  country: string | null;
  blockedCountry: boolean;
  resolved: boolean;
};

type IAction = {
  setGeo: (geo: { country: string | null; blockedCountry: boolean }) => void;
};

export const useGeoStore = create<IState & IAction>()(
  devtools((set) => ({
    country: null,
    blockedCountry: false,
    resolved: false,
    setGeo: (geo) => set({ ...geo, resolved: true }),
  }))
);
