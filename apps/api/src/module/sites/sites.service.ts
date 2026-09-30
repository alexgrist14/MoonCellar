import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { isValidObjectId, type Model } from "mongoose";
import type {
  ISaveSiteSessionRequest,
  ISiteSession,
  ITestSiteSessionResponse,
} from "@mooncellar/schemas";
import {
  downloadRemotePage,
  setSessionHeadersProvider,
} from "../../shared/remote-image";
import {
  SiteSession,
  type SiteSessionDocument,
} from "./schemas/site-session.schema";

const CACHE_TTL_MS = 60_000;
const CIPHER = "aes-256-gcm";

type ISessionHeaders = { domain: string; headers: Record<string, string> };

const collectCookies = (value: unknown, cookies: Map<string, string>): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectCookies(item, cookies));
    return;
  }

  if (!value || typeof value !== "object") return;

  const { name, value: cookieValue } = value as Record<string, unknown>;

  if (typeof name === "string" && typeof cookieValue === "string") {
    cookies.set(name, cookieValue);
    return;
  }

  Object.values(value).forEach((item) => collectCookies(item, cookies));
};

export const parseCookieInput = (
  raw: string
): { cookie: string; userAgent?: string } => {
  const input = raw.trim().replace(/^cookie:\s*/i, "");

  if (input.startsWith("{") || input.startsWith("[")) {
    try {
      const json = JSON.parse(input) as unknown;
      const cookies = new Map<string, string>();

      collectCookies(json, cookies);

      const userAgent =
        json && typeof json === "object" && !Array.isArray(json)
          ? (json as Record<string, unknown>).userAgent
          : undefined;

      return {
        cookie: [...cookies]
          .map(([name, value]) => `${name}=${value}`)
          .join("; "),
        ...(typeof userAgent === "string" && { userAgent }),
      };
    } catch {
      return { cookie: "" };
    }
  }

  const netscape = input
    .split("\n")
    .map((line) => line.trim().split("\t"))
    .filter((parts) => parts.length >= 7 && !parts[0].startsWith("#"));

  if (netscape.length) {
    return {
      cookie: netscape.map((parts) => `${parts[5]}=${parts[6]}`).join("; "),
    };
  }

  return { cookie: input.includes("=") ? input : "" };
};

@Injectable()
export class SitesService implements OnModuleInit {
  private readonly logger = new Logger(SitesService.name);
  private cache?: { loadedAt: number; sessions: ISessionHeaders[] };

  constructor(
    @InjectModel(SiteSession.name)
    private readonly Sessions: Model<SiteSessionDocument>
  ) {}

  onModuleInit() {
    setSessionHeadersProvider((url) => this.headersFor(url.hostname));
  }

  async getSessions(): Promise<ISiteSession[]> {
    const sessions = await this.Sessions.find().sort({ domain: 1 }).lean();

    return sessions.map((session) => this.toResponse(session));
  }

  async saveSession(
    id: string | undefined,
    { domain, cookie, userAgent, referer }: ISaveSiteSessionRequest
  ): Promise<ISiteSession> {
    const parsed = cookie ? parseCookieInput(cookie) : undefined;

    if (cookie && !parsed?.cookie) {
      throw new BadRequestException(
        "No cookies found: paste the Cookie request header or a cookie export"
      );
    }

    const set: Partial<SiteSession> = {
      domain,
      userAgent: userAgent || parsed?.userAgent || null,
      referer: referer || null,
      ...(parsed?.cookie && { cookie: this.encrypt(parsed.cookie) }),
    };

    const session = id
      ? await this.Sessions.findByIdAndUpdate(this.assertId(id), set, {
          new: true,
        }).lean()
      : await this.Sessions.create(set).then((doc) => doc.toObject());

    if (!session) throw new NotFoundException("Site not found");

    this.cache = undefined;

    return this.toResponse(session);
  }

  async deleteSession(id: string) {
    const { deletedCount } = await this.Sessions.deleteOne({
      _id: this.assertId(id),
    });

    if (!deletedCount) throw new NotFoundException("Site not found");

    this.cache = undefined;
  }

  async testSession(id: string): Promise<ITestSiteSessionResponse> {
    const session = await this.Sessions.findById(this.assertId(id)).lean();

    if (!session) throw new NotFoundException("Site not found");

    try {
      const html = await downloadRemotePage(`https://${session.domain}/`, {
        useSessions: true,
      });
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();

      return {
        ok: true,
        message: `${title || "Untitled page"} · ${Math.round(html.length / 1024)} KB`,
      };
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    }
  }

  private async headersFor(hostname: string) {
    const sessions = await this.loadSessions();
    const match = sessions
      .filter(
        ({ domain }) => hostname === domain || hostname.endsWith(`.${domain}`)
      )
      .sort((a, b) => b.domain.length - a.domain.length)[0];

    return match?.headers ?? {};
  }

  private async loadSessions() {
    if (this.cache && Date.now() - this.cache.loadedAt < CACHE_TTL_MS) {
      return this.cache.sessions;
    }

    const sessions = await this.Sessions.find().lean();

    this.cache = {
      loadedAt: Date.now(),
      sessions: sessions.map((session) => {
        const headers: Record<string, string> = {};

        if (session.cookie) {
          try {
            const parsed = parseCookieInput(this.decrypt(session.cookie));

            headers.Cookie = parsed.cookie;
            if (parsed.userAgent) headers["User-Agent"] = parsed.userAgent;
          } catch (err) {
            this.logger.error(
              err,
              `Cannot decrypt the cookie of ${session.domain}`
            );
          }
        }
        if (session.userAgent) headers["User-Agent"] = session.userAgent;
        if (session.referer) headers.Referer = session.referer;

        return { domain: session.domain, headers };
      }),
    };

    return this.cache.sessions;
  }

  private getKey() {
    const secret = process.env.SITE_SESSIONS_KEY;

    if (!secret) {
      throw new ServiceUnavailableException("SITE_SESSIONS_KEY is not set");
    }

    return createHash("sha256").update(secret).digest();
  }

  private encrypt(value: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(CIPHER, this.getKey(), iv);
    const encrypted = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final(),
    ]);

    return [iv, cipher.getAuthTag(), encrypted]
      .map((part) => part.toString("base64"))
      .join(".");
  }

  private decrypt(value: string) {
    const [iv, tag, encrypted] = value
      .split(".")
      .map((part) => Buffer.from(part, "base64"));
    const decipher = createDecipheriv(CIPHER, this.getKey(), iv);

    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  }

  private assertId(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid id: ${id}`);

    return id;
  }

  private toResponse(
    session: SiteSession & { _id: unknown; updatedAt?: Date }
  ): ISiteSession {
    return {
      _id: String(session._id),
      domain: session.domain,
      hasCookie: !!session.cookie,
      userAgent: session.userAgent ?? null,
      referer: session.referer ?? null,
      updatedAt: new Date(session.updatedAt ?? Date.now()).toISOString(),
    };
  }
}
