export const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";

const OPENID_NS = "http://specs.openid.net/auth/2.0";
const OPENID_IDENTIFIER_SELECT = `${OPENID_NS}/identifier_select`;
const STEAM_CLAIMED_ID_REGEX =
  /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

export const buildSteamLoginUrl = (returnTo: string) => {
  const url = new URL(STEAM_OPENID_URL);

  url.search = new URLSearchParams({
    "openid.ns": OPENID_NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": new URL(returnTo).origin,
    "openid.identity": OPENID_IDENTIFIER_SELECT,
    "openid.claimed_id": OPENID_IDENTIFIER_SELECT,
  }).toString();

  return url.toString();
};

export const pickOpenIdParams = (params: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(params).filter(([key]) => key.startsWith("openid."))
  );

export const getAssertedSteamId = (
  params: Record<string, string>,
  returnTo: string
): string | null => {
  if (params["openid.mode"] !== "id_res") return null;
  if (params["openid.op_endpoint"] !== STEAM_OPENID_URL) return null;
  if (params["openid.return_to"] !== returnTo) return null;
  if (params["openid.identity"] !== params["openid.claimed_id"]) return null;

  return (
    params["openid.claimed_id"]?.match(STEAM_CLAIMED_ID_REGEX)?.[1] ?? null
  );
};

export const isValidCheckAuthenticationResponse = (body: string) =>
  body.split("\n").some((line) => line.trim() === "is_valid:true");
