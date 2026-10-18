import { describe, expect, it } from "bun:test";
import { GAME_STORAGE_PATH_PATTERN } from "@mooncellar/schemas";
import { quotaProblem } from "./storage-quota";

const limits = { maxFileBytes: 100, maxFiles: 2, maxBytes: 150 };

describe("quotaProblem", () => {
  it("accepts a file that fits", () => {
    expect(quotaProblem(limits, { files: 1, bytes: 40 }, null, 100)).toBeNull();
  });

  it("rejects a file over the file limit", () => {
    expect(
      quotaProblem(limits, { files: 0, bytes: 0 }, null, 101)
    ).not.toBeNull();
  });

  it("rejects a new file past the file count", () => {
    expect(
      quotaProblem(limits, { files: 2, bytes: 20 }, null, 10)
    ).not.toBeNull();
  });

  it("lets a replaced file keep its slot", () => {
    expect(quotaProblem(limits, { files: 2, bytes: 140 }, 90, 100)).toBeNull();
  });

  it("rejects a file that overflows the total", () => {
    expect(
      quotaProblem(limits, { files: 1, bytes: 100 }, null, 60)
    ).not.toBeNull();
  });
});

describe("GAME_STORAGE_PATH_PATTERN", () => {
  it.each([
    "LevelProgress",
    "GhostS00",
    "skin-1/model.glb",
    "skin-1/texture.png",
    "a/b/c/d",
  ])("accepts %s", (path) =>
    expect(GAME_STORAGE_PATH_PATTERN.test(path)).toBe(true)
  );

  it.each([
    "",
    "/abs",
    "../up",
    "a/../b",
    "a/./b",
    ".",
    "a//b",
    "a/b/c/d/e",
    "a b",
    "a\\b",
  ])("rejects %s", (path) =>
    expect(GAME_STORAGE_PATH_PATTERN.test(path)).toBe(false)
  );
});
