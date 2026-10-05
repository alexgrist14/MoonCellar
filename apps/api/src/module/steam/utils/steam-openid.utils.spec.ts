import {
  STEAM_OPENID_URL,
  buildSteamLoginUrl,
  getAssertedSteamId,
  isValidCheckAuthenticationResponse,
  pickOpenIdParams,
} from "./steam-openid.utils";

const RETURN_TO = "https://mooncellar.space/user/moon/settings";
const CLAIMED = "https://steamcommunity.com/openid/id/76561197960435530";

const assertion = (overrides: Record<string, string> = {}) => ({
  "openid.mode": "id_res",
  "openid.op_endpoint": STEAM_OPENID_URL,
  "openid.return_to": RETURN_TO,
  "openid.claimed_id": CLAIMED,
  "openid.identity": CLAIMED,
  ...overrides,
});

describe("steam openid utils", () => {
  it("builds a sign-in url that returns to the given page", () => {
    const url = new URL(buildSteamLoginUrl(RETURN_TO));

    expect(url.origin + url.pathname).toBe(STEAM_OPENID_URL);
    expect(url.searchParams.get("openid.return_to")).toBe(RETURN_TO);
    expect(url.searchParams.get("openid.realm")).toBe(
      "https://mooncellar.space"
    );
  });

  it("reads the SteamID64 from a valid assertion", () => {
    expect(getAssertedSteamId(assertion(), RETURN_TO)).toBe(
      "76561197960435530"
    );
  });

  it.each([
    ["mode", { "openid.mode": "cancel" }],
    ["endpoint", { "openid.op_endpoint": "https://evil.example/openid" }],
    ["return_to", { "openid.return_to": `${RETURN_TO}x` }],
    ["identity", { "openid.identity": `${CLAIMED}1` }],
    [
      "claimed_id",
      {
        "openid.claimed_id": "https://evil.example/openid/id/76561197960435530",
        "openid.identity": "https://evil.example/openid/id/76561197960435530",
      },
    ],
  ])("rejects an assertion with a wrong %s", (_, overrides) => {
    expect(getAssertedSteamId(assertion(overrides), RETURN_TO)).toBeNull();
  });

  it("keeps only openid parameters", () => {
    expect(pickOpenIdParams({ "openid.mode": "id_res", tab: "x" })).toEqual({
      "openid.mode": "id_res",
    });
  });

  it("accepts only an explicit is_valid:true line", () => {
    expect(
      isValidCheckAuthenticationResponse(
        "ns:http://specs.openid.net/auth/2.0\nis_valid:true\n"
      )
    ).toBe(true);
    expect(isValidCheckAuthenticationResponse("is_valid:false\n")).toBe(false);
  });
});
