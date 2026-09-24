import { IGameResponse } from "@mooncellar/schemas";

type IGamePictures = Pick<
  IGameResponse,
  "artworks" | "screenshots" | "backgroundImage" | "bannerImage"
>;

const getOwnPicture = (game: IGamePictures, url?: string | null) =>
  url && (game.artworks?.includes(url) || game.screenshots?.includes(url))
    ? url
    : undefined;

export const getGameBanner = (game: IGamePictures) =>
  getOwnPicture(game, game.bannerImage) ??
  game.artworks?.[0] ??
  game.screenshots?.[0];

export const getGameBackgrounds = (game: IGamePictures): string[] => {
  const chosen = getOwnPicture(game, game.backgroundImage);

  if (chosen) return [chosen];

  return (game.artworks?.length ? game.artworks : game.screenshots) ?? [];
};
