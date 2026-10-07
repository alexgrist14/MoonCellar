import { IGameResponse } from "@mooncellar/schemas";

const EXACT_DAY_PATTERN = /^[A-Z][a-z]{2} \d{1,2}, \d{4}$/;

export const formatReleaseDate = (game: IGameResponse): string | null => {
  if (game.release_dates?.length) {
    const matching = game.first_release
      ? game.release_dates.find((d) => d.date === game.first_release)
      : undefined;

    if (matching?.human) return matching.human;

    const soonest = [...game.release_dates].sort((a, b) => a.date - b.date)[0];
    if (soonest?.human) return soonest.human;
  }

  if (game.first_release) {
    return new Date(game.first_release * 1000).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  return null;
};

export const isExactReleaseDay = (label: string | null): boolean =>
  !!label && EXACT_DAY_PATTERN.test(label);
