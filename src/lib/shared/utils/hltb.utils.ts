import { IGameResponse } from "../lib/schemas/games.schema";

export interface IHltbAmount {
  amount: string;
  unit: string;
}

export const getHltbAmount = (hours?: number | null): IHltbAmount | null => {
  if (hours == null || hours <= 0) {
    return null;
  }

  const whole = Math.floor(hours);
  const fraction = hours - whole;

  if (Math.abs(fraction - 0.5) < 0.01) {
    return whole > 0
      ? { amount: `${whole}½`, unit: "Hours" }
      : { amount: "½", unit: "Hour" };
  }

  const rounded = Math.round(hours);

  return { amount: `${rounded}`, unit: rounded === 1 ? "Hour" : "Hours" };
};

export const formatHltbHours = (hours?: number | null): string | null => {
  const parts = getHltbAmount(hours);

  return !parts ? null : `${parts.amount} ${parts.unit}`;
};

export interface IHltbTile extends IHltbAmount {
  label: string;
}

export const getHltbTiles = (game: IGameResponse): IHltbTile[] => {
  if (!game.hltb) {
    return [];
  }

  const tiles = [
    { label: "Main story", parts: getHltbAmount(game.hltb.mainStory) },
    { label: "Main + extra", parts: getHltbAmount(game.hltb.mainExtra) },
    { label: "Completionist", parts: getHltbAmount(game.hltb.completionist) },
  ];

  return tiles.flatMap(({ label, parts }) =>
    !parts ? [] : [{ label, ...parts }]
  );
};
