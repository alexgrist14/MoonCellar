import { Types } from "mongoose";
import { toVndbMatchSubject } from "../services/vndb.service";
import type { IVndbTitles } from "../services/vndb.service";
import { resolveMatch } from "./game-matcher.utils";
import { VNDB_MATCH_PROFILE } from "./match-profiles";
import type {
  IMatchContext,
  IMatchResult,
  TMatchCandidate,
} from "./game-matcher.types";

const resolve = (
  vn: IVndbTitles,
  candidates: TMatchCandidate[],
  context: IMatchContext
): IMatchResult =>
  resolveMatch(toVndbMatchSubject(vn), candidates, context, VNDB_MATCH_PROFILE);

const PC_ID = new Types.ObjectId("000000000000000000000001");
const SWITCH_ID = new Types.ObjectId("000000000000000000000002");

const context = (sharedTitles: string[] = []): IMatchContext => ({
  platformSlugById: new Map([
    [String(PC_ID), "win"],
    [String(SWITCH_ID), "switch"],
  ]),
  sharedTitles: new Set(sharedTitles),
});

const LONG_STORY =
  "Kazuki transfers to a remote mountain academy where a mysterious clocktower rings every midnight and the students forget the previous day entirely, until a silent librarian named Aoi hands him a diary written in his own handwriting describing events that have not happened yet";
const OTHER_STORY =
  "Pirates navigate stormy oceans searching buried treasure while rival captains negotiate fragile alliances aboard enormous galleons crewed by talking parrots, sword fighting skeletons and mechanical krakens powered by volcanic crystals harvested from distant tropical islands";

const vn = (overrides: Partial<IVndbTitles> = {}): IVndbTitles =>
  ({
    id: "v1",
    type: "Main Game",
    name: "Midnight Clocktower Academy",
    originalName: "Mayonaka Tokeitou Gakuen",
    alternativeNames: ["Mayonaka Tokeitou Gakuen"],
    released: "2015-06-12",
    releaseDates: ["2015-06-12"],
    description: LONG_STORY,
    developers: ["Moonlight Works"],
    publishers: [],
    platforms: ["win"],
    ...overrides,
  }) as IVndbTitles;

let seq = 0;

const game = (overrides: Partial<TMatchCandidate> = {}): TMatchCandidate =>
  ({
    _id: new Types.ObjectId(),
    slug: `game-${++seq}`,
    name: "Midnight Clocktower Academy",
    nameNormalized: "midnight clocktower academy",
    type: "Main Game",
    genres: ["Visual Novel"],
    first_release: Date.UTC(2015, 5, 20) / 1000,
    release_dates: [],
    alternative_names: [],
    companies: [
      {
        name: "Moonlight Works",
        developer: true,
        publisher: false,
        porting: false,
        supporting: false,
      },
    ],
    platformIds: [PC_ID],
    summary: LONG_STORY,
    ...overrides,
  }) as TMatchCandidate;

const summarize = (match: IMatchResult) => ({
  verdict: match.verdict,
  reason: match.reason,
  winner: match.winner?.name ?? null,
  candidates: match.candidates.map((candidate) => ({
    name: candidate.game.name,
    score: candidate.score,
    breakdown: candidate.breakdown,
    dateSignal: candidate.dateSignal,
    descriptionSignal: candidate.descriptionSignal,
    hasCompanyMismatch: candidate.hasCompanyMismatch,
  })),
});

const CASES: [string, () => IMatchResult][] = [
  ["no candidates", () => resolve(vn(), [], context())],
  [
    "unrelated candidate below threshold",
    () =>
      resolve(
        vn(),
        [
          game({
            name: "Ocean Pirate Saga",
            genres: ["Shooter"],
            first_release: Date.UTC(2003, 0, 1) / 1000,
            companies: [],
            summary: OTHER_STORY,
          }),
        ],
        context()
      ),
  ],
  [
    "exact title confirmed by date and developer",
    () => resolve(vn(), [game()], context()),
  ],
  [
    "distinctive title without dates or companies",
    () =>
      resolve(
        vn({ releaseDates: [], developers: [], description: "" }),
        [game({ first_release: null, companies: [], summary: "" })],
        context()
      ),
  ],
  [
    "short title is weak",
    () =>
      resolve(
        vn({ name: "Aoi", originalName: "Aoi", alternativeNames: [] }),
        [game({ name: "Aoi", nameNormalized: "aoi" })],
        context()
      ),
  ],
  [
    "release dates contradict",
    () =>
      resolve(
        vn(),
        [game({ first_release: Date.UTC(2004, 0, 1) / 1000 })],
        context()
      ),
  ],
  [
    "incompatible genre",
    () => resolve(vn(), [game({ genres: ["Racing", "Sport"] })], context()),
  ],
  [
    "descriptions differ and no company evidence",
    () =>
      resolve(
        vn({ developers: [] }),
        [game({ companies: [], summary: OTHER_STORY })],
        context()
      ),
  ],
  [
    "developers differ",
    () =>
      resolve(
        vn({ developers: ["Sunrise Games"] }),
        [game({ first_release: null })],
        context(["midnight clocktower academy"])
      ),
  ],
  [
    "two identical candidates compete",
    () => resolve(vn(), [game(), game()], context()),
  ],
  [
    "fan disc against a main game",
    () => resolve(vn({ type: "Fan Disc" }), [game()], context()),
  ],
  [
    "platform mismatch",
    () => resolve(vn(), [game({ platformIds: [SWITCH_ID] })], context()),
  ],
  [
    "re-edition candidate loses to the original",
    () =>
      resolve(
        vn(),
        [game({ type: "Remaster" }), game({ first_release: null })],
        context()
      ),
  ],
  [
    "match only through an alternative name",
    () =>
      resolve(
        vn(),
        [
          game({
            name: "Clocktower Gakuen",
            nameNormalized: "clocktower gakuen",
            alternative_names: ["Mayonaka Tokeitou Gakuen"],
          }),
        ],
        context()
      ),
  ],
  [
    "fuzzy similar title",
    () =>
      resolve(
        vn(),
        [
          game({
            name: "Midnight Clocktower Academy Remastered Edition",
            nameNormalized: "midnight clocktower academy remastered edition",
          }),
        ],
        context()
      ),
  ],
];

describe("VNDB match characterization", () => {
  beforeEach(() => {
    seq = 0;
  });

  it.each(CASES)("%s", (_, run) => {
    expect(summarize(run())).toMatchSnapshot();
  });
});
