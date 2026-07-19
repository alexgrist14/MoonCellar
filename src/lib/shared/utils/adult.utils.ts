import { IGameResponse } from "../lib/schemas/games.schema";

export const ADULT_THEME_NAME = "Erotic";

export const isAdultGame = (
  game?: Pick<IGameResponse, "themes"> | null
): boolean => {
  const themes = game?.themes as string[] | string | null | undefined;

  if (Array.isArray(themes)) return themes.includes(ADULT_THEME_NAME);
  if (typeof themes === "string") return themes === ADULT_THEME_NAME;

  return false;
};
