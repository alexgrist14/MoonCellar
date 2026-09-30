import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import { IImageProvider } from "@mooncellar/schemas";
import { toast } from "@/src/lib/shared/utils/toast.utils";

export interface IGeneratedImageEntry {
  id: string;
  prompt: string;
  provider: IImageProvider;
  model: string;
  dataUrl: string;
  createdAt: string;
  savedId?: string;
  url?: string;
  parentId?: string;
  elementName?: string;
}

type IState = {
  entries: IGeneratedImageEntry[];
  addEntry: (entry: IGeneratedImageEntry) => void;
  updateEntry: (id: string, patch: Partial<IGeneratedImageEntry>) => void;
  removeEntry: (id: string) => void;
};

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      toast.error({
        description:
          "Local storage is full, the list was not saved. Delete some images.",
      });
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};

export const useGeneratedImagesStore = create<IState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: entry.parentId
            ? [...state.entries, entry]
            : [entry, ...state.entries],
        })),
      updateEntry: (id, patch) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...patch } : entry
          ),
        })),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter(
            (entry) => entry.id !== id && entry.parentId !== id
          ),
        })),
    }),
    {
      name: "generated-images",
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
