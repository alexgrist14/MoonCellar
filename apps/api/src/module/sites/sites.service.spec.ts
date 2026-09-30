import { parseCookieInput } from "./sites.service";

describe("parseCookieInput", () => {
  it("keeps a Cookie header as it is", () => {
    expect(parseCookieInput("Cookie: a=1; b=2")).toEqual({
      cookie: "a=1; b=2",
    });
  });

  it("reads a nested extension export with a user agent", () => {
    const raw = JSON.stringify({
      userAgent: "Mozilla/5.0 Test",
      "example.com": {
        "example.com": {
          sid: { name: "sid", value: "s1", domain: "example.com" },
          user: { name: "user", value: "u1", domain: "example.com" },
        },
      },
    });

    expect(parseCookieInput(raw)).toEqual({
      cookie: "sid=s1; user=u1",
      userAgent: "Mozilla/5.0 Test",
    });
  });

  it("reads a cookie array export", () => {
    const raw = JSON.stringify([
      { name: "a", value: "1" },
      { name: "b", value: "2" },
    ]);

    expect(parseCookieInput(raw).cookie).toBe("a=1; b=2");
  });

  it("reads a cookies.txt file", () => {
    const raw =
      "# Netscape HTTP Cookie File\n.example.com\tTRUE\t/\tTRUE\t0\tsid\ts1\n";

    expect(parseCookieInput(raw).cookie).toBe("sid=s1");
  });

  it("returns nothing for text without cookies", () => {
    expect(parseCookieInput("hello").cookie).toBe("");
  });
});
