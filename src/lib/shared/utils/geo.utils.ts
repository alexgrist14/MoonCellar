import { headers } from "next/headers";
import { open, type Reader, type CountryResponse } from "maxmind";

const DB_PATH = process.env.GEOIP_DB_PATH || "/app/geo/GeoLite2-Country.mmdb";

const BLOCKED = new Set(
  (process.env.GEO_BLOCK_COUNTRIES || "RU")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
);

let readerPromise: Promise<Reader<CountryResponse>> | null = null;

function getReader(): Promise<Reader<CountryResponse>> {
  if (!readerPromise) {
    readerPromise = open<CountryResponse>(DB_PATH);
  }
  return readerPromise;
}

function extractClientIp(
  xRealIp: string | null,
  xForwardedFor: string | null
): string | null {
  if (xRealIp && xRealIp.trim()) return xRealIp.trim();
  if (xForwardedFor && xForwardedFor.trim())
    return xForwardedFor.split(",")[0].trim();
  return null;
}

export async function getClientGeo(): Promise<{
  country: string | null;
  blockedCountry: boolean;
}> {
  try {
    const h = await headers();
    const ip = extractClientIp(h.get("x-real-ip"), h.get("x-forwarded-for"));
    if (!ip) return { country: null, blockedCountry: false };

    const reader = await getReader();
    const result = reader.get(ip);
    const country = result?.country?.iso_code ?? null;

    return {
      country,
      blockedCountry: country ? BLOCKED.has(country.toUpperCase()) : false,
    };
  } catch {
    return { country: null, blockedCountry: false };
  }
}
