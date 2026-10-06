import { IAchievementsFilter } from "@mooncellar/schemas";

export const ACHIEVEMENTS_FILTER_LABELS: Record<IAchievementsFilter, string> = {
  steam: "Steam",
  ra: "RetroAchievements",
  both: "Both",
  any: "Either",
};

export const ACHIEVEMENTS_FILTER_OPTIONS: {
  value: IAchievementsFilter | undefined;
  label: string;
  hint: string;
}[] = [
  { value: undefined, label: "All games", hint: "" },
  { value: "steam", label: "Steam", hint: "Steam achievements" },
  { value: "ra", label: "RetroAchievements", hint: "At least one RA set" },
  { value: "both", label: "Both", hint: "Steam and RA" },
  { value: "any", label: "Either", hint: "Steam or RA" },
];
