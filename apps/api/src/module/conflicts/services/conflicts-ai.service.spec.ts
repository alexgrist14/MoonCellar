import mongoose from "mongoose";
import {
  ConflictSourceSchema,
  type IConflictAiVerdict,
  type IConflictItem,
} from "@mooncellar/schemas";
import { callOpenAi } from "../../../shared/openai";
import {
  buildConflictAiInput,
  isConflictAiMatch,
  toConflictAiVerdict,
} from "../utils/conflicts-ai.utils";
import { ConflictsAiService } from "./conflicts-ai.service";

jest.mock("../../../shared/openai", () => ({
  ...jest.requireActual("../../../shared/openai"),
  callOpenAi: jest.fn(),
}));

const PLATFORM_ID = String(new mongoose.Types.ObjectId());
const GAME_A = String(new mongoose.Types.ObjectId());
const GAME_B = String(new mongoose.Types.ObjectId());
const ADMIN = { _id: new mongoose.Types.ObjectId(), userName: "admin" };

const answer = (body: Record<string, unknown>) => ({
  id: "resp",
  output: [
    {
      type: "message",
      content: [{ type: "output_text", text: JSON.stringify(body) }],
    },
  ],
});

const verdict = (
  overrides: Partial<IConflictAiVerdict> = {}
): IConflictAiVerdict => ({
  gameIds: [GAME_A],
  confidence: "high",
  reason: "Same game.",
  model: "gpt-5-mini",
  judgedAt: "2026-10-14T00:00:00.000Z",
  ...overrides,
});

const conflict = (externalId: string, aiVerdict?: IConflictAiVerdict) => ({
  externalId,
  externalData: aiVerdict ? { aiVerdict } : null,
  candidates: [{ gameId: GAME_A }, { gameId: GAME_B }],
});

const candidate = (gameId: string, linkedExternalId: string | null = null) => ({
  gameId,
  slug: "envoy",
  name: "Envoy",
  score: 0.5,
  breakdown: {
    title: 1,
    companies: 0,
    date: 0,
    platforms: 0,
    genre: 0,
    type: 0,
  },
  dateSignal: "unknown" as const,
  descriptionSignal: "unknown" as const,
  hasCompanyMismatch: false,
  matchedTitle: null,
  isManual: false,
  game: {
    cover: null,
    type: "Main Game",
    summary: "A game.",
    alternativeNames: [],
    companies: [
      { name: "Dev", developer: true, publisher: false },
      { name: "Pub", developer: false, publisher: true },
    ].map((company) => ({ ...company, porting: false, supporting: false })),
    firstRelease: 1_600_000_000,
    platformIds: [PLATFORM_ID],
    isCustom: true,
    linkedExternalId,
  },
});

const item = (externalId: string): IConflictItem => ({
  id: "c",
  source: "steam",
  direction: "games",
  isMultiMatch: false,
  externalId,
  reason: null,
  state: "waiting",
  remaining: 1,
  nextExternalId: null,
  decidedBy: null,
  isUndoable: false,
  subject: {
    name: "Envoy",
    originalName: "",
    alternativeNames: [],
    description: "A game.",
    released: "2020-09-13",
    developers: ["Dev"],
    platformIds: [PLATFORM_ID],
    lengthMinutes: null,
    cover: null,
    isExplicitCover: false,
    url: null,
  },
  candidates: [candidate(GAME_A), candidate(GAME_B, "999")],
  entries: [],
  aiVerdict: null,
});

const buildService = (undecided: unknown[]) => {
  const conflicts = {
    findUndecided: jest.fn().mockResolvedValue(undecided),
    setExternalData: jest.fn().mockResolvedValue(undefined),
    decide: jest.fn().mockResolvedValue({}),
    getItem: jest.fn((_source: string, externalId: string) =>
      Promise.resolve(item(externalId))
    ),
    canUndo: jest.fn((source: string) => source === "hltb"),
    findAiResolvedIds: jest.fn(),
    undo: jest.fn(),
  };
  const service = new ConflictsAiService(
    { db: {} } as never,
    {
      find: () => ({
        select: () => ({
          lean: () => Promise.resolve([{ _id: PLATFORM_ID, name: "PC" }]),
        }),
      }),
    } as never,
    conflicts as never
  );

  return { service, conflicts };
};

describe("Conflicts AI review", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
    jest.mocked(callOpenAi).mockReset();
  });

  it("keeps only candidate ids in a verdict and applies only confident matches", () => {
    const parsed = toConflictAiVerdict(
      JSON.stringify({
        gameIds: ["x", "a", "a"],
        confidence: "high",
        reason: "r",
      }),
      ["a", "b"],
      "gpt-5-mini"
    );

    expect(parsed.gameIds).toEqual(["a"]);
    expect(isConflictAiMatch(parsed)).toBe(true);
    expect(isConflictAiMatch({ ...parsed, confidence: "medium" })).toBe(false);
    expect(isConflictAiMatch({ ...parsed, gameIds: [] })).toBe(false);
    expect(isConflictAiMatch({ ...parsed, undoneAt: "2026-10-14" })).toBe(
      false
    );
  });

  it("describes the entry and every candidate from the review item", () => {
    const input = JSON.parse(
      buildConflictAiInput(item("1"), new Map([[PLATFORM_ID, "PC"]]))
    );

    expect(input.entry).toMatchObject({
      platforms: ["PC"],
      developers: ["Dev"],
    });
    expect(input.candidates[0]).toMatchObject({
      id: GAME_A,
      platforms: ["PC"],
      developers: ["Dev"],
      publishers: ["Pub"],
      released: "2020-09-13",
      linkedToAnotherEntry: false,
    });
    expect(input.candidates[1].linkedToAnotherEntry).toBe(true);
  });

  it("stores verdicts and decides nothing on a dry run", async () => {
    jest
      .mocked(callOpenAi)
      .mockResolvedValue(
        answer({ gameIds: [GAME_A], confidence: "high", reason: "r" }) as never
      );
    const { service, conflicts } = buildService([
      conflict("1"),
      conflict("2", verdict()),
    ]);

    const totals = await service.review(
      "steam",
      { limit: 10, apply: false },
      ADMIN
    );

    expect(callOpenAi).toHaveBeenCalledTimes(1);
    expect(conflicts.setExternalData).toHaveBeenCalledWith("steam", [
      {
        externalId: "1",
        externalData: {
          aiVerdict: expect.objectContaining({ gameIds: [GAME_A] }),
        },
      },
    ]);
    expect(conflicts.decide).not.toHaveBeenCalled();
    expect(totals).toMatchObject({ judged: 1, matches: 1, decided: 0 });
  });

  it("applies confident stored and new verdicts, never weak ones", async () => {
    jest
      .mocked(callOpenAi)
      .mockResolvedValueOnce(
        answer({ gameIds: [GAME_B], confidence: "high", reason: "r" }) as never
      )
      .mockResolvedValueOnce(
        answer({
          gameIds: [GAME_A],
          confidence: "medium",
          reason: "r",
        }) as never
      );
    const { service, conflicts } = buildService([
      conflict("1", verdict()),
      conflict("2", verdict({ confidence: "low" })),
      conflict("3"),
      conflict("4"),
    ]);

    await service.review("steam", { limit: 10, apply: true }, ADMIN);

    expect(
      conflicts.decide.mock.calls.map(([, id, choice]) => [id, choice])
    ).toEqual([
      ["1", { gameIds: [GAME_A] }],
      ["3", { gameIds: [GAME_B] }],
    ]);
  });

  it("applies only the stored verdicts when it judges none", async () => {
    const { service, conflicts } = buildService([
      conflict("1", verdict()),
      conflict("2"),
    ]);

    await service.review("vndb", { limit: 0, apply: true }, ADMIN);

    expect(callOpenAi).not.toHaveBeenCalled();
    expect(conflicts.decide.mock.calls.map(([, id]) => id)).toEqual(["1"]);
  });

  it("uses the judge a source registered instead of the generic one", async () => {
    const { service, conflicts } = buildService([conflict("1")]);
    const judge = jest.fn().mockResolvedValue(verdict());

    service.register("hltb", { judge });
    await service.review("hltb", { limit: 10, apply: false }, ADMIN);

    expect(judge).toHaveBeenCalledTimes(1);
    expect(conflicts.getItem).not.toHaveBeenCalled();
    expect(callOpenAi).not.toHaveBeenCalled();
  });

  it("undoes every match the AI made, and goes on past a failure", async () => {
    const { service, conflicts } = buildService([]);

    conflicts.findAiResolvedIds.mockResolvedValue(["1", "2", "3"]);
    conflicts.undo
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("relinked"))
      .mockResolvedValueOnce({});

    expect(await service.undoAll("hltb", ADMIN)).toBe(2);
  });

  it("refuses to undo a source whose matches cannot be undone", () => {
    const { service } = buildService([]);

    expect(() => service.startUndo("steam", ADMIN)).toThrow(
      "steam decisions cannot be undone"
    );
  });

  it("counts every source before it starts, then reviews them in turn", async () => {
    jest
      .mocked(callOpenAi)
      .mockResolvedValue(
        answer({ gameIds: [GAME_A], confidence: "high", reason: "r" }) as never
      );
    const { service, conflicts } = buildService([
      conflict("1"),
      conflict("2"),
      conflict("3", verdict()),
    ]);
    const jobs: (() => Promise<unknown>)[] = [];

    jest
      .spyOn(service as never, "runInBackground")
      .mockImplementation(((_kind: unknown, run: () => Promise<unknown>) =>
        jobs.push(run)) as never);
    service.start(undefined, { limit: 1, apply: false }, ADMIN);
    await jobs[0]();

    const sources = ConflictSourceSchema.options;

    expect(
      conflicts.findUndecided.mock.calls.map(([source]) => source)
    ).toEqual(sources);
    expect(service.getStatus()).toMatchObject({
      total: sources.length,
      done: sources.length,
      judged: sources.length,
    });
  });

  it("counts stored verdicts it applies as progress", async () => {
    const { service } = buildService([
      conflict("1", verdict()),
      conflict("2", verdict({ confidence: "low" })),
      conflict("3"),
    ]);

    await service.review("vndb", { limit: 0, apply: true }, ADMIN);

    expect(service.getStatus()).toMatchObject({
      total: 1,
      done: 1,
      decided: 1,
    });
  });

  it("undoes only the sources that can undo when none is given", () => {
    const { service } = buildService([]);

    jest
      .spyOn(service as never, "runInBackground")
      .mockImplementation(() => undefined as never);

    expect(service.startUndo(undefined, ADMIN).message).toBe(
      "Undoing every hltb match the AI made"
    );
  });

  it("adds games only for confident no-match verdicts the source allows", async () => {
    const noMatch = verdict({ gameIds: [] });
    const { service, conflicts } = buildService([
      conflict("game", noMatch),
      {
        ...conflict("dlc", noMatch),
        externalData: { aiVerdict: noMatch, type: "dlc" },
      },
      conflict("weak", verdict({ gameIds: [], confidence: "medium" })),
      conflict("undone", verdict({ gameIds: [], undoneAt: "2026-10-15" })),
      conflict("match", verdict()),
    ]);
    const jobs: (() => Promise<unknown>)[] = [];

    service.register("hltb", {
      canCreate: ({ externalData }) => externalData?.type !== "dlc",
    });
    jest
      .spyOn(service as never, "runInBackground")
      .mockImplementation(((_kind: unknown, run: () => Promise<unknown>) =>
        jobs.push(run)) as never);
    service.startCreate("hltb", ADMIN);
    await jobs[0]();

    expect(
      conflicts.decide.mock.calls.map(([, id, choice, , options]) => [
        id,
        choice,
        options,
      ])
    ).toEqual([["game", { gameId: null }, { isAi: true }]]);
    expect(service.getStatus()).toMatchObject({ total: 1, decided: 1 });
  });

  it("refuses to add games for a source that does not allow it", () => {
    const { service } = buildService([]);

    expect(() => service.startCreate("steam", ADMIN)).toThrow(
      "The AI does not add steam entries as new games"
    );
  });

  it("undoes only the picked matches", async () => {
    const { service, conflicts } = buildService([]);
    const jobs: (() => Promise<unknown>)[] = [];

    conflicts.findAiResolvedIds.mockResolvedValue(["1", "2", "3"]);
    conflicts.undo.mockResolvedValue({});
    jest
      .spyOn(service as never, "runInBackground")
      .mockImplementation(((_kind: unknown, run: () => Promise<unknown>) =>
        jobs.push(run)) as never);

    expect(
      service.startUndo(undefined, ADMIN, [
        { source: "hltb", externalId: "3" },
        { source: "hltb", externalId: "9" },
        { source: "steam", externalId: "1" },
      ]).message
    ).toBe("Undoing 3 AI matches");
    await jobs[0]();

    expect(
      conflicts.undo.mock.calls.map(([source, id]) => [source, id])
    ).toEqual([["hltb", "3"]]);
    expect(service.getStatus()).toMatchObject({ total: 1, undone: 1 });
  });

  it("stops when a whole batch fails", async () => {
    jest.mocked(callOpenAi).mockRejectedValue(new Error("429"));
    const { service, conflicts } = buildService([conflict("1"), conflict("2")]);

    await expect(
      service.review("steam", { limit: 10, apply: true }, ADMIN)
    ).rejects.toThrow("a whole batch failed");
    expect(conflicts.setExternalData).not.toHaveBeenCalled();
  });
});
