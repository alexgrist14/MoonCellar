import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import axios from "axios";

export const REMOTE_IMAGE_MAX_BYTES = 15 * 1024 * 1024;

const REMOTE_IMAGE_TIMEOUT_MS = 15000;
const REMOTE_IMAGE_MAX_REDIRECTS = 3;
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];

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

type ISessionHeadersProvider = (url: URL) => Promise<Record<string, string>>;

export type IRemoteFetchOptions = { useSessions?: boolean };

let sessionHeaders: ISessionHeadersProvider = async () => ({});

export const setSessionHeadersProvider = (
  provider: ISessionHeadersProvider
) => {
  sessionHeaders = provider;
};

const withSession = async (
  url: URL,
  headers: Record<string, string>,
  options?: IRemoteFetchOptions
) => ({
  ...headers,
  ...(options?.useSessions ? await sessionHeaders(url) : {}),
});

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
  raw: string,
  options?: IRemoteFetchOptions
): Promise<{ buffer: Buffer; mimetype: string }> => {
  let url = await assertPublicUrl(raw);

  for (let hop = 0; hop <= REMOTE_IMAGE_MAX_REDIRECTS; hop++) {
    const response = await axios.get<ArrayBuffer>(url.toString(), {
      responseType: "arraybuffer",
      timeout: REMOTE_IMAGE_TIMEOUT_MS,
      maxRedirects: 0,
      maxContentLength: REMOTE_IMAGE_MAX_BYTES,
      validateStatus: (status) => status < 400,
      headers: await withSession(
        url,
        { "User-Agent": "Mozilla/5.0", Referer: `${url.origin}/` },
        options
      ),
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

const REMOTE_PAGE_MAX_BYTES = 5 * 1024 * 1024;
const BLOCK_REDIRECT_HOST = /(^|\.)google\.[a-z.]+$/;

export const downloadRemotePage = async (
  raw: string,
  options?: IRemoteFetchOptions
): Promise<string> => {
  let url = await assertPublicUrl(raw);

  for (let hop = 0; hop <= REMOTE_IMAGE_MAX_REDIRECTS; hop++) {
    const response = await axios.get<string>(url.toString(), {
      responseType: "text",
      timeout: REMOTE_IMAGE_TIMEOUT_MS,
      maxRedirects: 0,
      maxContentLength: REMOTE_PAGE_MAX_BYTES,
      validateStatus: (status) => status < 400,
      headers: await withSession(
        url,
        { "User-Agent": "Mozilla/5.0", "Accept-Language": "en" },
        options
      ),
    });

    if (response.status >= 300) {
      const location = response.headers.location;

      if (!location) throw new Error(`Redirect without a location: ${url}`);

      const next = new URL(location, url);

      if (BLOCK_REDIRECT_HOST.test(next.hostname) && next.host !== url.host) {
        throw new Error(
          `${url.host} redirected to ${next.host}: the site blocks requests from this server's region`
        );
      }

      url = await assertPublicUrl(next.toString());
      continue;
    }

    return response.data;
  }

  throw new Error(`Too many redirects: ${raw}`);
};

const PAGE_IMAGE_CANDIDATES_LIMIT = 80;
const PAGE_IMAGE_MIN_BYTES = 10 * 1024;
const PAGE_IMAGE_PATTERNS = [
  /<a[^>]+href="([^"]+\.(?:jpe?g|png|webp|avif|gif)(?:\?[^"]*)?)"/gi,
  /<meta[^>]+(?:property|name)="(?:og:image|twitter:image)"[^>]+content="([^"]+)"/gi,
  /<img[^>]+data-(?:src|url)="([^"]+)"/gi,
  /<img[^>]+src="([^"]+)"/gi,
];

export const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

export const extractPageImageUrls = (html: string, pageUrl: string) => {
  const urls = PAGE_IMAGE_PATTERNS.flatMap((pattern) =>
    [...html.matchAll(pattern)].map(([, src]) => {
      try {
        return new URL(src.replace(/&amp;/g, "&"), pageUrl).toString();
      } catch {
        return null;
      }
    })
  ).filter((src): src is string => !!src && /^https?:/.test(src));

  return [...new Set(urls)];
};

export const findPageImages = async (
  pageUrl: string,
  limit: number,
  options?: IRemoteFetchOptions
) => {
  const html = await downloadRemotePage(pageUrl, options);
  const candidates = extractPageImageUrls(html, pageUrl).slice(
    0,
    PAGE_IMAGE_CANDIDATES_LIMIT
  );
  const checked = await Promise.all(
    candidates.map((url) =>
      downloadRemoteImage(url, options)
        .then(({ buffer }) =>
          buffer.length >= PAGE_IMAGE_MIN_BYTES ? url : null
        )
        .catch(() => null)
    )
  );

  return checked.filter((url): url is string => !!url).slice(0, limit);
};
