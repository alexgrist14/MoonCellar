import { IPlaythroughMinimal } from "@mooncellar/schemas";
import { playthroughPriorityOrder } from "../../constants/user.const";
import { CategoriesType } from "../../types/user.type";

export type IGameControlTone = CategoriesType | "favorite" | "list";

export const getPlaythroughsTone = (
  playthroughs?: IPlaythroughMinimal[]
): CategoriesType | undefined => {
  if (!playthroughs?.length) return undefined;

  if (playthroughs.some((play) => play.isMastered)) return "mastered";

  return [...playthroughPriorityOrder]
    .reverse()
    .find((category) =>
      playthroughs.some((play) => play.category === category)
    );
};
