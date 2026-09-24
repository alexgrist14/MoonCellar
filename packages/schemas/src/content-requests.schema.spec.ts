import { describe, expect, it } from "bun:test";
import {
  CreateContentRequestSchema,
  DecideContentRequestSchema,
} from "./content-requests.schema";

const messages = (input: unknown) =>
  CreateContentRequestSchema.safeParse(input).error?.issues.map(
    (issue) => issue.message
  ) ?? [];

describe("CreateContentRequestSchema", () => {
  it("accepts a new game with image links", () => {
    expect(
      CreateContentRequestSchema.safeParse({
        kind: "game",
        action: "add",
        payload: {
          name: "Hollow Knight: Silksong",
          screenshots: ["https://example.com/a.jpg"],
        },
      }).success
    ).toBe(true);
  });

  it("requires a name for a new entry and a target for an update", () => {
    expect(messages({ kind: "game", action: "add", payload: {} })).toEqual([
      "A name, an IGDB id or a VNDB id is required",
      "Fill at least one field",
    ]);
    expect(
      messages({ kind: "character", action: "update", payload: { gender: "F" } })
    ).toEqual(["Pick what to update"]);
  });

  it("accepts a new game identified only by a source id", () => {
    expect(
      CreateContentRequestSchema.safeParse({
        kind: "game",
        action: "add",
        payload: { igdbId: 1942 },
      }).success
    ).toBe(true);
    expect(
      messages({ kind: "game", action: "add", payload: { vndbId: "17" } })
    ).toEqual(["A VNDB id looks like v17"]);
  });

  it("rejects non-http links and unknown fields", () => {
    expect(
      messages({
        kind: "character",
        action: "add",
        payload: { name: "Hornet", mugShot: "javascript:alert(1)" },
      })
    ).toEqual(["Use an http(s) link"]);
    expect(
      CreateContentRequestSchema.safeParse({
        kind: "game",
        action: "add",
        payload: { name: "Doom", isCustom: false },
      }).success
    ).toBe(false);
  });
});

describe("DecideContentRequestSchema", () => {
  it("requires a reason to reject", () => {
    expect(DecideContentRequestSchema.safeParse({ decision: "reject" }).success).toBe(false);
    expect(DecideContentRequestSchema.safeParse({ decision: "approve" }).success).toBe(true);
  });
});
