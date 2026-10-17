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
const REQUEST_TIMEOUT_MS = 10_000;

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);
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

  private async call<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.apiUrl()}/auth/game${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    return this.call<IGameDeviceCode>("/device", { deviceName });
  }

  pollDeviceSignIn(deviceCode: string) {
    return this.call<IGameDeviceToken>("/device/token", { deviceCode });
  }

  async signOut(token: string) {
    this.cache.delete(token);
    await this.call<void>("/token/revoke", { token });
  }

  async introspect(token: string): Promise<IGameTokenIntrospection> {
    const now = Date.now();
    const cached = this.cache.get(token);
    if (cached && cached.expiresAt > now) return cached.result;
    const result = await this.call<IGameTokenIntrospection>(
      "/token/introspect",
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
}
