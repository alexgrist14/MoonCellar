import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  IGameAccount,
  IGameDeviceCode,
  IGameDeviceToken,
  IGameTokenIntrospection,
} from "@mooncellar/schemas";

const INTROSPECTION_TTL_MS = 30_000;
const FRIENDS_TTL_MS = 60_000;

type IApiPerson = { _id: string; userName: string; avatar?: string };
const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
  private readonly friendsCache = new Map<
    string,
    { expiresAt: number; friends: IGameAccount[] }
  >();
  private readonly cache = new Map<
    string,
    { expiresAt: number; result: IGameTokenIntrospection }
  >();

  constructor(private readonly config: ConfigService) {}

  private apiUrl() {
    const url = this.config.get<string>("API_URL");
    if (!url) {
      throw new ServiceUnavailableException(
        "Accounts are not configured on this server"
      );
    }
    return url.replace(/\/+$/, "");
  }

  private async call<T>(path: string, body?: unknown): Promise<T> {
    const url = `${this.apiUrl()}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: body === undefined ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.warn(`Account service ${url}: ${error}`);
      throw new ServiceUnavailableException(
        "The account service is not reachable right now"
      );
    }
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new HttpException(
        typeof data?.message === "string"
          ? data.message
          : "The account service rejected the request",
        response.status
      );
    }
    return data as T;
  }

  startDeviceSignIn(deviceName: string) {
    return this.call<IGameDeviceCode>("/auth/game/device", { deviceName });
  }

  pollDeviceSignIn(deviceCode: string) {
    return this.call<IGameDeviceToken>("/auth/game/device/token", {
      deviceCode,
    });
  }

  async signOut(token: string) {
    this.cache.delete(token);
    await this.call<void>("/auth/game/token/revoke", { token });
  }

  async introspect(token: string): Promise<IGameTokenIntrospection> {
    const now = Date.now();
    const cached = this.cache.get(token);
    if (cached && cached.expiresAt > now) return cached.result;
    const result = await this.call<IGameTokenIntrospection>(
      "/auth/game/token/introspect",
      { token }
    );
    if (this.cache.size > 10_000) this.cache.clear();
    this.cache.set(token, { expiresAt: now + INTROSPECTION_TTL_MS, result });
    return result;
  }

  async accountOf(token: string): Promise<IGameAccount | null> {
    const result = await this.introspect(token);
    return result.active && result.account ? result.account : null;
  }

  async friendsOf(userId: string): Promise<IGameAccount[]> {
    const now = Date.now();
    const cached = this.friendsCache.get(userId);
    if (cached && cached.expiresAt > now) return cached.friends;
    const [followings, followers] = await Promise.all([
      this.call<{ followings?: IApiPerson[] }>(`/user/followings/${userId}`),
      this.call<{ followers?: IApiPerson[] }>(`/user/followers/${userId}`),
    ]);
    const byId = new Map<string, IGameAccount>();
    for (const person of [
      ...(followings.followings ?? []),
      ...(followers.followers ?? []),
    ]) {
      if (!person?._id || person._id === userId || byId.has(person._id)) {
        continue;
      }
      byId.set(person._id, {
        id: person._id,
        userName: person.userName,
        avatar: person.avatar || null,
      });
    }
    const friends = [...byId.values()].sort((a, b) =>
      a.userName.localeCompare(b.userName)
    );
    if (this.friendsCache.size > 10_000) this.friendsCache.clear();
    this.friendsCache.set(userId, { expiresAt: now + FRIENDS_TTL_MS, friends });
    return friends;
  }
}
