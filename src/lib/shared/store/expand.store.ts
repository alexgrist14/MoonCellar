import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type IExpandPosition = "left" | "right" | "bottom-left" | "bottom-right";

type IState = {
  expanded?: IExpandPosition[];
};

type IAction = {
  setExpanded: (expanded: IExpandPosition[]) => void;
};

export const useExpandStore = create<IState & IAction>()(
  devtools(
    (set) => ({
      setExpanded: (expanded) => set({ expanded }),
    }),
    {
      name: "expand",
    }
  )
);
