import { clip, companiesWith } from "../../conflicts/utils/conflicts-ai.utils";
import {
  type HltbPage,
  type HltbSearchEntry,
  mapHltbEntryToField,
} from "./hltb.utils";

export type THltbAiGame = {
  _id: { toString(): string };
  name: string;
  alternative_names?: string[] | null;
  type?: string | null;
  first_release?: number | null;
  platformIds?: { toString(): string }[] | null;
  companies?: { name: string; developer?: boolean; publisher?: boolean }[];
  summary?: string | null;
};

export const HLTB_AI_INSTRUCTIONS = `You decide which games of a video game catalogue are the same game as one HowLongToBeat (HLTB) entry, so that the entry's playtimes can be shown on them. You get the HLTB entry and the catalogue games an automatic matcher could not decide on; none of them may be the entry.

A candidate is the entry when it is the same game: the same title and content, made by the same developer around the same time. HLTB keeps one entry per game for all platforms, so a port or a re-release on another platform is the entry, and so is an edition that only bundles or renames the same game (Game of the Year, Deluxe, Definitive, Director's Cut). Several candidates can be the entry.

A candidate is not the entry when:
- it is a sequel, a prequel, a spin-off or another number in a series;
- it is a DLC, an expansion, an episode or a season of the entry, or the entry is an add-on of it;
- it is a remake or a remaster released on its own, unless the entry clearly is that version;
- it only shares the title: a different developer, an unrelated description or releases decades apart mean a different game.

Release years can differ by a year or two, because HLTB dates a game by its earliest release anywhere (early access, Japan, arcade). Platform lists are often incomplete on both sides. Missing data is not evidence against a match; a contradiction is.

Answer with the ids of the candidates that are the entry, or an empty list when none is. Set confidence to "high" only when the title, the developer or the description, and the dates agree and nothing contradicts them; "medium" when the match is likely but a key fact is missing; "low" when you are guessing. Write the reason as one sentence that names the deciding facts and the chosen game by its title, never by its id.`;

export const buildHltbAiInput = ({
  entry,
  page,
  games,
  platformNames,
}: {
  entry: HltbSearchEntry;
  page: HltbPage | null;
  games: THltbAiGame[];
  platformNames: Map<string, string>;
}) => {
  const times = mapHltbEntryToField(entry);

  return JSON.stringify({
    hltbEntry: {
      name: entry.name,
      alias: entry.alias || null,
      type: entry.type ?? null,
      released: page?.released ?? entry.releaseYear ?? null,
      platforms: entry.platforms ?? [],
      developers: page?.developers ?? [],
      publishers: page?.publishers ?? [],
      hours: {
        main: times.mainStory,
        mainExtra: times.mainExtra,
        completionist: times.completionist,
        coop: times.coop,
        versus: times.multiplayer,
      },
      description: clip(page?.summary, 800),
    },
    candidates: games.map((game) => ({
      id: String(game._id),
      name: game.name,
      alternativeNames: game.alternative_names ?? [],
      type: game.type ?? null,
      released: game.first_release
        ? new Date(game.first_release * 1000).toISOString().slice(0, 10)
        : null,
      platforms: (game.platformIds ?? []).flatMap((id) => {
        const name = platformNames.get(String(id));

        return name ? [name] : [];
      }),
      developers: companiesWith(game.companies, "developer"),
      publishers: companiesWith(game.companies, "publisher"),
      description: clip(game.summary, 500),
    })),
  });
};
