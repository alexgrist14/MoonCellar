import mongoose from "mongoose";
import type { IConflictAiVerdict } from "@mooncellar/schemas";
import { callOpenAi } from "../../shared/openai";
import { HltbAiService } from "./services/hltb-ai.service";
import {
  buildHltbAiInput,
  isHltbAiMatch,
  toHltbAiVerdict,
} from "./utils/hltb-ai.utils";

jest.mock("../../shared/openai", () => ({
  ...jest.requireActual("../../shared/openai"),
  callOpenAi: jest.fn(),
}));

const PLATFORM_ID = new mongoose.Types.ObjectId();
const GAME_A = new mongoose.Types.ObjectId();
const GAME_B = new mongoose.Types.ObjectId();
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
  gameIds: [String(GAME_A)],
  confidence: "high",
  reason: "Same game.",
  model: "gpt-5-mini",
  judgedAt: "2026-10-14T00:00:00.000Z",
  ...overrides,
});

const conflict = (externalId: string, aiVerdict?: IConflictAiVerdict) => ({
  externalId,
  externalData: {
    name: `Entry ${externalId}`,
    platforms: ["PC"],
    ...(aiVerdict && { aiVerdict }),
  },
  candidates: [{ gameId: GAME_A }, { gameId: GAME_B }],
});

const buildService = (undecided: unknown[]) => {
  const games = [
    { _id: GAME_A, name: "Envoy", platformIds: [PLATFORM_ID] },
    { _id: GAME_B, name: "Envoy", platformIds: [] },
  ];
  const lean = (value: unknown) => ({
    select: () => ({ lean: () => Promise.resolve(value) }),
  });
  const conflicts = {
    findUndecided: jest.fn().mockResolvedValue(undecided),
    setExternalData: jest.fn().mockResolvedValue(undefined),
    decide: jest.fn().mockResolvedValue({}),
  };
  const service = new HltbAiService(
    { find: () => lean(games) } as never,
    {
      find: () => lean([{ _id: PLATFORM_ID, name: "PC (Microsoft Windows)" }]),
    } as never,
    conflicts as never,
    {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as never
  );

  (service as unknown as { hltbClient: unknown }).hltbClient = {
    getById: jest.fn().mockResolvedValue({ success: false }),
  };

  return { service, conflicts };
};

describe("HLTB AI review", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
    jest.mocked(callOpenAi).mockReset();
  });

  it("keeps only candidate ids in a verdict and applies only confident matches", () => {
    const parsed = toHltbAiVerdict(
      JSON.stringify({
        gameIds: ["x", "a", "a"],
        confidence: "high",
        reason: "r",
      }),
      ["a", "b"],
      "gpt-5-mini"
    );

    expect(parsed.gameIds).toEqual(["a"]);
    expect(isHltbAiMatch(parsed)).toBe(true);
    expect(isHltbAiMatch({ ...parsed, confidence: "medium" })).toBe(false);
    expect(isHltbAiMatch({ ...parsed, gameIds: [] })).toBe(false);
  });

  it("names each candidate's platforms and developers in the input", () => {
    const input = JSON.parse(
      buildHltbAiInput({
        entry: { id: 1, name: "Envoy", mainTime: 7200 },
        page: null,
        games: [
          {
            _id: GAME_A,
            name: "Envoy",
            platformIds: [PLATFORM_ID],
            first_release: 1_600_000_000,
            companies: [
              { name: "Dev", developer: true, publisher: false },
              { name: "Pub", developer: false, publisher: true },
            ],
          },
        ],
        platformNames: new Map([[String(PLATFORM_ID), "PC"]]),
      })
    );

    expect(input.hltbEntry.hours.main).toBe(2);
    expect(input.candidates[0]).toMatchObject({
      id: String(GAME_A),
      platforms: ["PC"],
      developers: ["Dev"],
      publishers: ["Pub"],
      released: "2020-09-13",
    });
  });

  it("stores verdicts and decides nothing on a dry run", async () => {
    jest.mocked(callOpenAi).mockResolvedValue(
      answer({
        gameIds: [String(GAME_A)],
        confidence: "high",
        reason: "r",
      }) as never
    );
    const { service, conflicts } = buildService([
      conflict("1"),
      conflict("2", verdict()),
    ]);

    const totals = await service.review({ limit: 10, apply: false }, ADMIN);

    expect(callOpenAi).toHaveBeenCalledTimes(1);
    expect(conflicts.setExternalData).toHaveBeenCalledWith("hltb", [
      {
        externalId: "1",
        externalData: {
          aiVerdict: expect.objectContaining({ gameIds: [String(GAME_A)] }),
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
        answer({
          gameIds: [String(GAME_B)],
          confidence: "high",
          reason: "r",
        }) as never
      )
      .mockResolvedValueOnce(
        answer({
          gameIds: [String(GAME_A)],
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

    await service.review({ limit: 10, apply: true }, ADMIN);

    expect(
      conflicts.decide.mock.calls.map(([, id, choice]) => [id, choice])
    ).toEqual([
      ["1", { gameIds: [String(GAME_A)] }],
      ["3", { gameIds: [String(GAME_B)] }],
    ]);
  });

  it("never applies a verdict whose match an admin undid", () => {
    expect(isHltbAiMatch(verdict({ undoneAt: "2026-10-14" }))).toBe(false);
  });

  it("undoes every match the AI made, and goes on past a failure", async () => {
    const { service, conflicts } = buildService([]);
    Object.assign(conflicts, {
      findAiResolvedIds: jest.fn().mockResolvedValue(["1", "2", "3"]),
      undo: jest
        .fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error("relinked"))
        .mockResolvedValueOnce({}),
    });

    expect(await service.undoAll(ADMIN)).toBe(2);
  });

  it("stops when a whole batch fails", async () => {
    jest.mocked(callOpenAi).mockRejectedValue(new Error("429"));
    const { service, conflicts } = buildService([conflict("1"), conflict("2")]);

    await expect(
      service.review({ limit: 10, apply: true }, ADMIN)
    ).rejects.toThrow("a whole batch failed");
    expect(conflicts.setExternalData).not.toHaveBeenCalled();
  });
});
