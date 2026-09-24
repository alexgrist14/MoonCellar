import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import axios from "axios";

export const REMOTE_IMAGE_MAX_BYTES = 15 * 1024 * 1024;

const REMOTE_IMAGE_TIMEOUT_MS = 15000;
const REMOTE_IMAGE_MAX_REDIRECTS = 3;
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const PRIVATE_V4_RANGES: [number, number][] = [
  [0x00000000, 8],
  [0x0a000000, 8],
  [0x64400000, 10],
  [0x7f000000, 8],
  [0xa9fe0000, 16],
  [0xac100000, 12],
  [0xc0000000, 24],
  [0xc0a80000, 16],
  [0xc6120000, 15],
  [0xe0000000, 3],
];

const ipv4ToNumber = (ip: string) =>
  ip.split(".").reduce((total, part) => total * 256 + Number(part), 0);

export const isPrivateAddress = (ip: string): boolean => {
  if (isIP(ip) === 4) {
    const value = ipv4ToNumber(ip);

    return PRIVATE_V4_RANGES.some(
      ([base, bits]) =>
        Math.floor(value / 2 ** (32 - bits)) ===
        Math.floor(base / 2 ** (32 - bits))
    );
  }

  const normalized = ip.toLowerCase();
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mapped) return isPrivateAddress(mapped[1]);

  return (
    normalized === "::" ||
    normalized === "::1" ||
    /^f[cd]/.test(normalized) ||
    /^fe[89ab]/.test(normalized)
  );
};

const assertPublicUrl = async (raw: string) => {
  const url = new URL(raw);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Unsupported protocol: ${url.protocol}`);
  }

  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [host]
    : (await lookup(host, { all: true })).map(({ address }) => address);

  if (!addresses.length || addresses.some(isPrivateAddress)) {
    throw new Error(`Refusing a private address: ${url.hostname}`);
  }

  return url;
};

export const downloadRemoteImage = async (
  raw: string
): Promise<{ buffer: Buffer; mimetype: string }> => {
  let url = await assertPublicUrl(raw);

  for (let hop = 0; hop <= REMOTE_IMAGE_MAX_REDIRECTS; hop++) {
    const response = await axios.get<ArrayBuffer>(url.toString(), {
      responseType: "arraybuffer",
      timeout: REMOTE_IMAGE_TIMEOUT_MS,
      maxRedirects: 0,
      maxContentLength: REMOTE_IMAGE_MAX_BYTES,
      validateStatus: (status) => status < 400,
    });

    if (response.status >= 300) {
      const location = response.headers.location;

      if (!location) throw new Error(`Redirect without a location: ${url}`);

      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }

    const mimetype = String(response.headers["content-type"] ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!IMAGE_MIME_TYPES.includes(mimetype)) {
      throw new Error(`Not an image: ${mimetype || "unknown type"}`);
    }

    return { buffer: Buffer.from(response.data), mimetype };
  }

  throw new Error(`Too many redirects: ${raw}`);
};
