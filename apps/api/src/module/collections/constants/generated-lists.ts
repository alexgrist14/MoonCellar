export const GENERATED_LISTS_OWNER = {
  userName: "MoonCellar",
  email: "lists@mooncellar.space",
};

export const GENERATED_LIST_SIZE = 100;
export const GENERATED_LIST_VOTES_STEPS = [100, 50, 20, 10, 1];
export const GENERATED_LIST_GAME_TYPES = ["Main Game"];
export const GENERATED_LIST_PRIOR_MEAN = 65;
export const GENERATED_LIST_PRIOR_VOTES = 100;
export const GENERATED_LIST_HLTB_WEIGHT = 10;
export const GENERATED_LIST_LAUNCH_WINDOW_SECONDS = 365 * 24 * 60 * 60;

export const GENERATED_LIST_DECADES: [number, number][] = [
  [1990, 2000],
  [2001, 2010],
  [2011, 2020],
  [2021, 2030],
];

export const GENERATED_LISTS_CRON = "0 5 * * 1";
export const GENERATED_LISTS_CRON_OPTIONS = {
  name: "generated-lists-refresh",
  timeZone: "Europe/Moscow",
};
