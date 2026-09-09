import { config } from "dotenv";
config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";
import { spawnSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { AddGameRequestSchema } from "../../src/shared/zod/schemas/games.schema";
import { getS3Config } from "../../src/shared/constants";

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3228";
const SEARXNG_URL = process.env.SEARXNG_URL || "http://localhost:8891";
const FRONT_URL = process.env.FRONT_URL || "https://mooncellar.space";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ACCESS_TOKEN_COOKIE = "accessMoonToken";

const S3_BUCKETS = {
  cover: "mooncellar-covers",
  screenshots: "mooncellar-screenshots",
  artworks: "mooncellar-artworks",
} as const;

const s3 = new S3Client(getS3Config());

const clearExistingImages = async (bucketName: string, slug: string) => {
  const existing = await s3.send(
    new ListObjectsV2Command({ Bucket: bucketName, Prefix: `${slug}/` })
  );
  const keys = (existing.Contents || [])
    .map((o) => o.Key)
    .filter((k): k is string => !!k);

  if (keys.length) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      })
    );
  }
};

const IMAGE_EXT_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

// Matches --cover-ratio (528/704) in MoonCellar/src/lib/app/styles/vars/_components.scss
const COVER_ASPECT_RATIO = 528 / 704;

// Artworks must be at least 720p quality (shorter side >= 720px)
const ARTWORK_MIN_DIMENSION = 720;

type CropPosition = "left" | "center" | "right" | number;

const cropPositionToOffsetPercent = (position: CropPosition): number => {
  if (typeof position === "number") return position;
  return position === "left" ? 0 : position === "right" ? 100 : 50;
};

const getImageDimensions = (filePath: string): { width: number; height: number } => {
  const result = spawnSync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height",
    "-of",
    "csv=p=0",
    filePath,
  ]);
  const [width, height] = result.stdout.toString().trim().split(",").map(Number);
  return { width, height };
};

const checkRemoteImageAspectRatio = async (
  url: string
): Promise<{ width: number; height: number; ratio: number } | null> => {
  const tmpIn = join(tmpdir(), `dims-${randomBytes(6).toString("hex")}.img`);
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    writeFileSync(tmpIn, Buffer.from(await res.arrayBuffer()));
    const { width, height } = getImageDimensions(tmpIn);
    if (!width || !height) return null;
    return { width, height, ratio: width / height };
  } catch {
    return null;
  } finally {
    try {
      unlinkSync(tmpIn);
    } catch {}
  }
};

const cropToAspectRatio = (
  bytes: Buffer<ArrayBuffer>,
  targetRatio: number,
  position: CropPosition
): Buffer<ArrayBuffer> => {
  const tmpIn = join(tmpdir(), `crop-in-${randomBytes(6).toString("hex")}.img`);
  const tmpOut = join(tmpdir(), `crop-out-${randomBytes(6).toString("hex")}.jpg`);
  writeFileSync(tmpIn, bytes);

  try {
    const { width, height } = getImageDimensions(tmpIn);
    if (!width || !height) return bytes;

    const currentRatio = width / height;
    const offsetPercent = cropPositionToOffsetPercent(position);

    let cropW = width;
    let cropH = height;
    let x = 0;
    let y = 0;

    if (currentRatio > targetRatio) {
      cropW = Math.round(height * targetRatio);
      x = Math.round((width - cropW) * (offsetPercent / 100));
    } else if (currentRatio < targetRatio) {
      cropH = Math.round(width / targetRatio);
      y = Math.round((height - cropH) * (offsetPercent / 100));
    } else {
      return bytes;
    }

    const result = spawnSync("ffmpeg", [
      "-y",
      "-i",
      tmpIn,
      "-vf",
      `crop=${cropW}:${cropH}:${x}:${y}`,
      tmpOut,
    ]);

    if (result.status !== 0) {
      console.error("ffmpeg crop failed:", result.stderr?.toString());
      return bytes;
    }

    return readFileSync(tmpOut);
  } finally {
    try {
      unlinkSync(tmpIn);
    } catch {}
    try {
      unlinkSync(tmpOut);
    } catch {}
  }
};

const uploadImagesToS3 = async (
  bucketName: string,
  slug: string,
  urls: string[],
  cropOptions?: { ratio: number; position: CropPosition },
  minDimension?: number
): Promise<string[]> => {
  await clearExistingImages(bucketName, slug);

  const links: string[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Image fetch failed (${res.status}): ${url}`);
        continue;
      }

      let bytes = Buffer.from(await res.arrayBuffer());
      if (!bytes.length) continue;

      if (minDimension) {
        const tmpCheck = join(tmpdir(), `dim-check-${randomBytes(6).toString("hex")}.img`);
        writeFileSync(tmpCheck, bytes);
        const { width, height } = getImageDimensions(tmpCheck);
        try {
          unlinkSync(tmpCheck);
        } catch {}
        if (!width || !height || Math.min(width, height) < minDimension) {
          console.error(
            `Skipped ${url}: ${width}x${height} is below the ${minDimension}px minimum`
          );
          continue;
        }
      }

      let contentType = res.headers.get("content-type")?.split(";")[0].trim();
      let ext = IMAGE_EXT_BY_CONTENT_TYPE[contentType] || "jpg";

      if (cropOptions) {
        bytes = cropToAspectRatio(bytes, cropOptions.ratio, cropOptions.position);
        contentType = "image/jpeg";
        ext = "jpg";
      }

      const key = `${slug}/${randomBytes(12).toString("hex")}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: `${key}.${ext}`,
          Body: bytes,
          ContentType: contentType || "image/jpeg",
          ACL: "public-read",
        })
      );

      links.push(
        `${process.env.S3_HOST_CDN.replace("%backet", bucketName)}${key}.${ext}`
      );
    } catch (e) {
      console.error(`Image upload error for ${url}:`, e);
    }
  }

  return links;
};

let cachedToken: string | null = null;

const login = async (): Promise<string> => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "ADMIN_EMAIL / ADMIN_PASSWORD are not set in the environment"
    );
  }

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }

  const cookies = res.headers.getSetCookie();
  const accessCookie = cookies.find((c) =>
    c.startsWith(`${ACCESS_TOKEN_COOKIE}=`)
  );

  if (!accessCookie) {
    throw new Error("Login succeeded but no access token cookie was set");
  }

  const token = accessCookie.split(";")[0].split("=")[1];
  cachedToken = token;
  return token;
};

const callApi = async (
  path: string,
  init: RequestInit = {},
  requireAuth = false
): Promise<Response> => {
  const doFetch = async () => {
    const headers = new Headers(init.headers);
    if (requireAuth) {
      const token = cachedToken ?? (await login());
      headers.set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);
    }
    return fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  };

  let res = await doFetch();

  if (requireAuth && res.status === 401) {
    cachedToken = null;
    res = await doFetch();
  }

  return res;
};

const server = new McpServer({ name: "game-adder", version: "0.1.0" });

server.registerTool(
  "search_web",
  {
    description:
      "Search the web via a local SearXNG instance. Use this to research game details (release date, developer, platforms, genres, cover image, etc.) before calling create_game.",
    inputSchema: {
      query: z.string().describe("Search query"),
      count: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Max number of results to return (default 10)"),
    },
  },
  async ({ query, count }) => {
    const url = new URL("/search", SEARXNG_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");

    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `SearXNG request failed: ${res.status} ${await res.text()}`,
          },
        ],
        isError: true,
      };
    }

    const data = (await res.json()) as {
      results?: { title: string; url: string; content?: string }[];
    };

    const results = (data.results || [])
      .slice(0, count ?? 10)
      .map((r) => ({ title: r.title, url: r.url, content: r.content }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.registerTool(
  "search_images",
  {
    description:
      "Search for images via a local SearXNG instance (image category). Use this to find screenshot/artwork/cover URLs for a game before calling create_game — pass the resulting img_src URLs directly as cover/screenshots/artworks.",
    inputSchema: {
      query: z.string().describe("Image search query"),
      count: z
        .number()
        .int()
        .min(1)
        .max(30)
        .optional()
        .describe("Max number of results to return (default 15)"),
    },
  },
  async ({ query, count }) => {
    const url = new URL("/search", SEARXNG_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("categories", "images");

    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `SearXNG request failed: ${res.status} ${await res.text()}`,
          },
        ],
        isError: true,
      };
    }

    const data = (await res.json()) as {
      results?: {
        title: string;
        url: string;
        img_src?: string;
        source?: string;
      }[];
    };

    const results = (data.results || [])
      .filter((r) => r.img_src)
      .slice(0, count ?? 15)
      .map((r) => ({
        title: r.title,
        img_src: r.img_src,
        pageUrl: r.url,
        source: r.source,
      }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.registerTool(
  "search_youtube",
  {
    description:
      "Search YouTube for trailers/gameplay/reviews via a local SearXNG instance (video category, filtered to youtube.com/youtu.be links only). Use this to find links for the videos field of create_game.",
    inputSchema: {
      query: z.string().describe("Video search query, e.g. \"<game name> trailer\""),
      count: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .describe("Max number of results to return (default 10)"),
    },
  },
  async ({ query, count }) => {
    const url = new URL("/search", SEARXNG_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("categories", "videos");

    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `SearXNG request failed: ${res.status} ${await res.text()}`,
          },
        ],
        isError: true,
      };
    }

    const data = (await res.json()) as {
      results?: { title: string; url: string }[];
    };

    const isYoutube = (u: string) =>
      /(^|\.)youtube\.com\/watch|youtu\.be\//.test(u);

    const results = (data.results || [])
      .filter((r) => isYoutube(r.url))
      .slice(0, count ?? 10)
      .map((r) => ({ title: r.title, url: r.url }));

    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

server.registerTool(
  "list_platforms",
  {
    description:
      "List all known platforms (id, name, slug) from MoonCellar. Use this to resolve platform names to the platformIds required by create_game.",
    inputSchema: {},
  },
  async () => {
    const res = await callApi("/platforms");
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to fetch platforms: ${res.status} ${await res.text()}`,
          },
        ],
        isError: true,
      };
    }

    const platforms = (await res.json()) as {
      _id: string;
      name: string;
      slug: string;
    }[];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            platforms.map((p) => ({ _id: p._id, name: p.name, slug: p.slug })),
            null,
            2
          ),
        },
      ],
    };
  }
);

server.registerTool(
  "create_game",
  {
    description:
      "Create a custom game in MoonCellar (POST /games/add), bypassing IGDB. Use this for games that cannot be parsed from IGDB (e.g. blocked/delisted). Requires ADMIN credentials configured on the MCP server. platformIds must be real Platform _id values obtained from list_platforms. " +
      "This tool requires confirmation: the first call (confirm omitted or false) does NOT write anything — it only returns a preview of what would be created, so the human user can be shown it and asked whether this is really the right game. Only call again with confirm: true, after the user has explicitly confirmed the preview, to actually insert it into the database. " +
      "All text fields (name, storyline, summary, genres, keywords, themes, modes, franchises, alternative_names, companies, release_dates.human, etc.) must be in English, regardless of the language of the sources used to research the game — translate before calling this tool. " +
      "screenshots is capped at 10 entries, artworks at 5 — pick the best if more are available. " +
      "cover/screenshots/artworks should be direct external image URLs found via search_web/search_images — on the real (confirm: true) call, this tool downloads them and re-uploads them to MoonCellar's own S3 buckets, exactly like the IGDB parser does, and stores the resulting S3 CDN links instead of the original external URLs. " +
      "artworks vs screenshots is ambiguous from search results alone (artwork = promotional/key art, box art, drawn art; screenshot = actual in-game capture). Before including a candidate image in either list, show its URL to the human user in chat and ask them to confirm which of the two it is — do not guess. Artworks additionally require at least 720p quality (shorter side >= 720px, check actual pixel dimensions, not just the URL/thumbnail label) — this tool silently drops any artwork candidate below that on upload, so pick a high-res source upfront rather than relying on the drop as a filter.  " +
      "videos should be YouTube links (trailers/gameplay) found via search_youtube. " +
      "The frontend displays cover at a fixed 3:4 portrait aspect ratio and crops anything else with CSS object-fit:cover. If the cover source image doesn't already have roughly that aspect ratio (e.g. a landscape Steam header banner), this tool crops it server-side to 3:4 on the real (confirm: true) call using coverCropPosition. The preview call checks the cover's actual dimensions and will warn if it doesn't match 3:4 and coverCropPosition wasn't given — when that happens, do NOT jump straight to asking for a crop position. " +
      "PREFERRED COVER SOURCE: steamgriddb.com — for any game with a Steam app id, check it FIRST for a portrait \"grid\" asset (they're usually ~600x900, much closer to 3:4 than a Steam header banner). steamgriddb.com itself blocks fetching, so resolve it this way: search_web(\"<game name> steamgriddb\") to find the game/grid page URL, then fetch the grid page's raw HTML with a normal browser user-agent (steamgriddb.com/grid/<id> — the HTML embeds a cdn2.steamgriddb.com/thumb/<hash>.<ext> reference even though it's a JS app) and swap /thumb/ for /grid/ on that same URL to get the full-res image (try .png first, then .jpg/.jpeg/.webp). If no usable SteamGridDB asset exists, fall back to search_images (queries like \"<game name> poster\", \"<game name> box art\", \"<game name> key art vertical\") for some other source already closer to 3:4 portrait — a real poster/box-art loses far less content than cropping a wide banner down to a sliver. Only if nothing reasonably-portrait turns up should you fall back to asking the human user in chat which position/offset to crop the original from (left/center/right, or an exact 0-100 percent), then re-call with their choice. Do not default to \"center\" on your own, and don't crop before checking for a better source.  " +
      "Don't stop at the core fields (name/type/cover/summary/genres/companies/release_dates/platformIds) — actively try to research and fill the rest of the schema too when a source has the info: languages (supported/audio languages), status (e.g. \"Released\"), player_perspectives (verify from an actual screenshot when unclear, don't assume \"First person\" by genre alone), game_engines, multiplayer_modes, ageRatings (only from an actual rating board, don't invent one), and especially externalPages — for a Steam-sourced game this should always include {name: \"Steam\", uid: \"<app id>\", url: \"https://store.steampowered.com/app/<app id>\"} (matches the convention IGDB-parsed games in this DB already use), plus any other storefront/service links found (itch.io, DLsite, GOG, Twitch directory, GiantBomb, etc). Leave a field empty rather than guessing when no real source supports it.",
    inputSchema: {
      ...AddGameRequestSchema.shape,
      screenshots: AddGameRequestSchema.shape.screenshots
        .unwrap()
        .max(10)
        .optional()
        .describe("At most 10 screenshot URLs"),
      artworks: AddGameRequestSchema.shape.artworks
        .unwrap()
        .max(5)
        .optional()
        .describe(
          "At most 5 artwork URLs (promotional/key art, not screenshots). Each candidate must be confirmed with the human user in chat before being included here. Must be at least 720p quality (shorter side >= 720px) — low-res candidates are silently dropped on upload, so check dimensions before picking one."
        ),
      coverCropPosition: z
        .union([z.enum(["left", "center", "right"]), z.number().min(0).max(100)])
        .optional()
        .describe(
          "If set, crop cover to the frontend's 3:4 portrait ratio before upload. 'left'/'center'/'right', or a 0-100 percent offset for exactly where the crop window starts along the axis being cut (0 = left/top edge, 100 = right/bottom edge). Omit to upload the cover uncropped."
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be explicitly set to true to actually create the game, after the user confirmed the preview. Omit or false to only get a preview."
        ),
    },
  },
  async ({ confirm, coverCropPosition, ...input }) => {
    if (!confirm) {
      let coverWarning = "";

      if (input.cover && coverCropPosition === undefined) {
        const dims = await checkRemoteImageAspectRatio(input.cover);
        if (dims) {
          const mismatch =
            Math.abs(dims.ratio - COVER_ASPECT_RATIO) / COVER_ASPECT_RATIO > 0.05;
          if (mismatch) {
            coverWarning =
              `\n\nCOVER ASPECT RATIO WARNING: cover is ${dims.width}x${dims.height} ` +
              `(ratio ${dims.ratio.toFixed(2)}), the frontend needs ~${COVER_ASPECT_RATIO.toFixed(2)} (3:4 portrait). ` +
              "coverCropPosition was not set. Before asking about cropping, try search_images for an alternative " +
              "source (poster/box art/key art) that's already closer to 3:4 portrait — that loses far less content " +
              "than cropping a wide banner. Only if nothing better turns up, ask the human user in chat whether to " +
              "crop left/center/right (or an exact 0-100 percent offset) — do not default to center yourself — " +
              "then re-call create_game with the chosen cover and/or coverCropPosition plus confirm: true.";
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text:
              "PREVIEW ONLY — nothing was written to the database.\n" +
              "Show this to the user and ask them to confirm this is the correct game before proceeding.\n" +
              "If confirmed, call create_game again with the exact same input plus confirm: true.\n\n" +
              JSON.stringify(
                { ...input, coverCropPosition: coverCropPosition ?? "(none — uploaded uncropped)" },
                null,
                2
              ) +
              coverWarning,
          },
        ],
      };
    }

    const uploaded = { ...input };

    if (uploaded.cover) {
      const [link] = await uploadImagesToS3(
        S3_BUCKETS.cover,
        uploaded.slug,
        [uploaded.cover],
        coverCropPosition !== undefined
          ? { ratio: COVER_ASPECT_RATIO, position: coverCropPosition }
          : undefined
      );
      if (link) uploaded.cover = link;
    }

    if (uploaded.screenshots?.length) {
      uploaded.screenshots = await uploadImagesToS3(
        S3_BUCKETS.screenshots,
        uploaded.slug,
        uploaded.screenshots
      );
    }

    if (uploaded.artworks?.length) {
      uploaded.artworks = await uploadImagesToS3(
        S3_BUCKETS.artworks,
        uploaded.slug,
        uploaded.artworks,
        undefined,
        ARTWORK_MIN_DIMENSION
      );
    }

    const res = await callApi(
      "/games/add",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploaded),
      },
      true
    );

    const text = await res.text();

    if (!res.ok) {
      return {
        content: [
          { type: "text", text: `Failed to create game: ${res.status} ${text}` },
        ],
        isError: true,
      };
    }

    const game = JSON.parse(text) as { _id: string; slug: string };

    return {
      content: [
        {
          type: "text",
          text:
            `Game created.\n` +
            `url: ${FRONT_URL}/games/${game.slug}\n` +
            `slug: ${game.slug}\n` +
            `id: ${game._id}\n\n` +
            text,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
