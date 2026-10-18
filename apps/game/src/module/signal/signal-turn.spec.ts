import { createHmac } from "node:crypto";
import { describe, expect, it } from "bun:test";
import { turnCredentials, turnUrls } from "./signal-turn";

describe("turnCredentials", () => {
  it("issues coturn REST credentials bound to the room and expiry", () => {
    const turn = turnCredentials(
      "secret",
      ["game.example:3478"],
      "ABCD",
      1_000_000_000_000,
      600
    );
    expect(turn.username).toBe("1000000600:ABCD");
    expect(turn.credential).toBe(
      createHmac("sha1", "secret").update("1000000600:ABCD").digest("base64")
    );
    expect(turn.urls).toEqual(["game.example:3478"]);
    expect(turn.ttl).toBe(600);
  });

  it("changes the credential with the secret", () => {
    const a = turnCredentials("one", [], "ABCD", 0);
    const b = turnCredentials("two", [], "ABCD", 0);
    expect(a.credential).not.toBe(b.credential);
  });
});

describe("turnUrls", () => {
  it("splits a comma list and drops blanks", () => {
    expect(turnUrls(" a:3478, ,b:3478 ")).toEqual(["a:3478", "b:3478"]);
    expect(turnUrls(undefined)).toEqual([]);
  });
});
