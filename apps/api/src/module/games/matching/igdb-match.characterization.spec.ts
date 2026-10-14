import { Types } from "mongoose";
import {
  isConfirmedIgdbMatch,
  toIgdbMatchSubject,
  type TIgdbMatchSource,
  withoutOtherIgdbGames,
} from "../../igdb/utils/igdb-match.utils";
import { resolveMatch } from "./game-matcher.utils";
import { IGDB_MATCH_PROFILE } from "./match-profiles";
import type {
  IMatchContext,
  IMatchResult,
  TMatchCandidate,
} from "./game-matcher.types";

const PC_ID = new Types.ObjectId("000000000000000000000001");
const SWITCH_ID = new Types.ObjectId("000000000000000000000002");

const context = (sharedTitles: string[] = []): IMatchContext => ({
  platformSlugById: new Map([
    [String(PC_ID), "win"],
    [String(SWITCH_ID), "switch"],
  ]),
  sharedTitles: new Set(sharedTitles),
});

const STORY =
  "A disgraced cartographer charts a drowned archipelago by lantern light, trading salvaged instruments with lighthouse keepers while a tide that never ebbs swallows one island every night";
const OTHER_STORY =
  "Street racers tune turbocharged hatchbacks in an underground garage, chasing sponsorship deals across neon highways while rival crews sabotage engines before the championship final";

const igdb = (overrides: Partial<TIgdbMatchSource> = {}): TIgdbMatchSource => ({
  id: 1001,
  name: "Lanterns of the Drowned Isles",
  game_type: { type: "Main Game" },
  summary: STORY,
  first_release_date: Date.UTC(2019, 2, 14) / 1000,
  alternative_names: [],
  involved_companies: [
    {
      company: { name: "Tidewater Studio" },
      developer: true,
      publisher: false,
      porting: false,
      supporting: false,
    },
  ],
  ...overrides,
});

let seq = 0;

const game = (overrides: Partial<TMatchCandidate> = {}): TMatchCandidate =>
  ({
    _id: new Types.ObjectId(),
    slug: `game-${++seq}`,
    name: "Lanterns of the Drowned Isles",
    nameNormalized: "lanterns of the drowned isles",
    type: "Main Game",
    genres: ["Adventure"],
    first_release: Date.UTC(2019, 2, 20) / 1000,
    release_dates: [],
    alternative_names: [],
    companies: [
      {
        name: "Tidewater Studio",
        developer: true,
        publisher: false,
        porting: false,
        supporting: false,
      },
    ],
    platformIds: [PC_ID],
    summary: STORY,
    ...overrides,
  }) as TMatchCandidate;

const resolve = (
  source: TIgdbMatchSource,
  candidates: TMatchCandidate[],
  ctx = context(),
  platformSlugs = ["win"]
): IMatchResult =>
  resolveMatch(
    toIgdbMatchSubject(source, platformSlugs),
    candidates,
    ctx,
    IGDB_MATCH_PROFILE
  );

const summarize = (match: IMatchResult) => ({
  verdict: match.verdict,
  reason: match.reason,
  winner: match.winner?.name ?? null,
  isConfirmed: isConfirmedIgdbMatch(match),
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
  ["no candidates", () => resolve(igdb(), [])],
  [
    "exact title confirmed by date and developer",
    () => resolve(igdb(), [game()]),
  ],
  [
    "exact title without companies is not confirmed",
    () => resolve(igdb({ involved_companies: [] }), [game({ companies: [] })]),
  ],
  [
    "unrelated candidate below threshold",
    () =>
      resolve(igdb(), [
        game({
          name: "Neon Garage Rivals",
          nameNormalized: "neon garage rivals",
          first_release: Date.UTC(2008, 0, 1) / 1000,
          companies: [],
          summary: OTHER_STORY,
        }),
      ]),
  ],
  [
    "release dates contradict",
    () =>
      resolve(igdb(), [game({ first_release: Date.UTC(2004, 0, 1) / 1000 })]),
  ],
  ["two identical candidates compete", () => resolve(igdb(), [game(), game()])],
  [
    "port against the main game",
    () => resolve(igdb({ game_type: { type: "Port" } }), [game()]),
  ],
  [
    "category without game_type",
    () =>
      resolve(igdb({ game_type: undefined, category: 0 }), [
        game({ type: "Remaster" }),
      ]),
  ],
  [
    "hand-made game goes to review",
    () => resolve(igdb(), [game({ isCustom: true })]),
  ],
  [
    "platform mismatch",
    () => resolve(igdb(), [game({ platformIds: [SWITCH_ID] })]),
  ],
  [
    "match only through an alternative name",
    () =>
      resolve(
        igdb({ alternative_names: [{ name: "Shizunda Shoto no Ranpu" }] }),
        [
          game({
            name: "Drowned Isles",
            nameNormalized: "drowned isles",
            alternative_names: ["Shizunda Shoto no Ranpu"],
          }),
        ]
      ),
  ],
  [
    "edition subtitle against the base game",
    () =>
      resolve(igdb({ name: "Lanterns of the Drowned Isles: Deluxe Edition" }), [
        game(),
      ]),
  ],
  [
    "Roman numeral against an Arabic one",
    () =>
      resolve(igdb({ name: "Lanterns of the Drowned Isles III" }), [
        game({
          name: "Lanterns of the Drowned Isles 3",
          nameNormalized: "lanterns of the drowned isles 3",
        }),
      ]),
  ],
  [
    "single-letter numeral stays a word",
    () =>
      resolve(igdb({ name: "Mega Rocket X" }), [
        game({ name: "Mega Rocket 10", nameNormalized: "mega rocket 10" }),
      ]),
  ],
  [
    "shared title is not distinctive",
    () =>
      resolve(
        igdb({ involved_companies: [], first_release_date: undefined }),
        [game({ companies: [], first_release: null })],
        context(["lanterns of the drowned isles"])
      ),
  ],
  [
    "candidate linked to another IGDB game is dropped first",
    () => {
      const other = game();
      const free = game({ first_release: null });

      return resolve(
        igdb(),
        withoutOtherIgdbGames(
          [other, free],
          new Map([[String(other._id), 2002]]),
          1001
        )
      );
    },
  ],
];

describe("IGDB match characterization", () => {
  beforeEach(() => {
    seq = 0;
  });

  it.each(CASES)("%s", (_, run) => {
    expect(summarize(run())).toMatchSnapshot();
  });
});
