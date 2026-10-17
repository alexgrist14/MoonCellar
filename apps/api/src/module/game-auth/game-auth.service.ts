import { createHash, randomBytes, randomInt } from "node:crypto";
import {
  ConflictException,
  GoneException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import type {
  IGameAccount,
  IGameDeviceCode,
  IGameDeviceLink,
  IGameDeviceToken,
  IGameSession,
  IGameTokenIntrospection,
} from "@mooncellar/schemas";
import type { Model } from "mongoose";
import type { User } from "../user/schemas/user.schema";
import { GameDeviceCode } from "./schemas/game-device-code.schema";
import { GameSession } from "./schemas/game-session.schema";

const CODE_LIFETIME_SECONDS = 600;
const POLL_INTERVAL_SECONDS = 5;
const TOKEN_LIFETIME = "365d";
const USER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LAST_USED_RESOLUTION_MS = 60_000;

type TGameTokenPayload = { id: string; sid: string; typ: "game" };

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export const normalizeUserCode = (code: string) => {
  const plain = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return plain.length === 8 ? `${plain.slice(0, 4)}-${plain.slice(4)}` : plain;
};

@Injectable()
export class GameAuthService {
  constructor(
    @InjectModel(GameDeviceCode.name)
    private readonly codes: Model<GameDeviceCode>,
    @InjectModel(GameSession.name)
    private readonly sessions: Model<GameSession>,
    @InjectModel("User") private readonly users: Model<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  private secret() {
    const secret = this.config.get<string>("JWT_SECRET");
    if (!secret) {
      throw new ServiceUnavailableException(
        "Signing in from the game is not configured on this server"
      );
    }
    return `${secret}:game`;
  }

  private verificationUrl() {
    const front = (
      this.config.get<string>("FRONT_URL") || "https://mooncellar.space"
    ).replace(/\/+$/, "");
    return `${front}/link`;
  }

  private account(user: User): IGameAccount {
    return {
      id: String(user._id),
      userName: user.userName,
      avatar: user.avatar || null,
    };
  }

  private newUserCode() {
    const chars = Array.from(
      { length: 8 },
      () => USER_CODE_ALPHABET[randomInt(USER_CODE_ALPHABET.length)]
    ).join("");
    return `${chars.slice(0, 4)}-${chars.slice(4)}`;
  }

  async createDeviceCode(deviceName: string): Promise<IGameDeviceCode> {
    const deviceCode = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + CODE_LIFETIME_SECONDS * 1000);
    for (let attempt = 0; ; attempt++) {
      const userCode = this.newUserCode();
      try {
        await this.codes.create({
          deviceCodeHash: hash(deviceCode),
          userCode,
          deviceName,
          expiresAt,
        });
        const verificationUrl = this.verificationUrl();
        return {
          deviceCode,
          userCode,
          verificationUrl,
          verificationUrlComplete: `${verificationUrl}?code=${userCode}`,
          expiresIn: CODE_LIFETIME_SECONDS,
          interval: POLL_INTERVAL_SECONDS,
        };
      } catch (error) {
        if ((error as { code?: number })?.code !== 11000 || attempt >= 4) {
          throw error;
        }
      }
    }
  }

  private async findByUserCode(userCode: string) {
    const code = await this.codes.findOne({
      userCode: normalizeUserCode(userCode),
      expiresAt: { $gt: new Date() },
    });
    if (!code) {
      throw new NotFoundException(
        "This code is unknown or has expired. Start signing in again in the game"
      );
    }
    return code;
  }

  async getLink(userCode: string): Promise<IGameDeviceLink> {
    const code = await this.findByUserCode(userCode);
    return {
      userCode: code.userCode,
      deviceName: code.deviceName,
      expiresAt: code.expiresAt.toISOString(),
      approved: !!code.approvedBy,
    };
  }

  async approve(userCode: string, user: User): Promise<IGameDeviceLink> {
    const code = await this.findByUserCode(userCode);
    if (code.approvedBy && String(code.approvedBy) !== String(user._id)) {
      throw new ConflictException(
        "This code has already been confirmed by another account"
      );
    }
    code.approvedBy = user._id as never;
    await code.save();
    return this.getLink(code.userCode);
  }

  async exchange(deviceCode: string): Promise<IGameDeviceToken> {
    const code = await this.codes.findOne({ deviceCodeHash: hash(deviceCode) });
    if (!code) {
      throw new NotFoundException(
        "This sign-in request is unknown. Start signing in again in the game"
      );
    }
    if (code.expiresAt.getTime() <= Date.now()) {
      throw new GoneException(
        "The sign-in code has expired. Start signing in again in the game"
      );
    }
    if (!code.approvedBy) {
      code.lastPolledAt = new Date();
      await code.save();
      return { status: "pending" };
    }
    const user = await this.users.findById(code.approvedBy);
    if (!user) {
      await code.deleteOne();
      throw new NotFoundException(
        "The account that confirmed this code no longer exists"
      );
    }
    const session = await this.sessions.create({
      userId: user._id,
      deviceName: code.deviceName,
      lastUsedAt: new Date(),
    });
    await code.deleteOne();
    const payload: TGameTokenPayload = {
      id: String(user._id),
      sid: String(session._id),
      typ: "game",
    };
    const token = this.jwt.sign(payload, {
      secret: this.secret(),
      expiresIn: TOKEN_LIFETIME,
    });
    return { status: "approved", token, account: this.account(user) };
  }

  private payloadOf(token: string): TGameTokenPayload | null {
    try {
      const payload = this.jwt.verify<TGameTokenPayload>(token, {
        secret: this.secret(),
      });
      return payload?.typ === "game" && payload.sid && payload.id
        ? payload
        : null;
    } catch {
      return null;
    }
  }

  async introspect(token: string): Promise<IGameTokenIntrospection> {
    const payload = this.payloadOf(token);
    if (!payload) return { active: false };
    const session = await this.sessions.findOne({
      _id: payload.sid,
      userId: payload.id,
      revokedAt: null,
    });
    if (!session) return { active: false };
    const user = await this.users.findById(payload.id);
    if (!user) return { active: false };
    if (Date.now() - session.lastUsedAt.getTime() > LAST_USED_RESOLUTION_MS) {
      session.lastUsedAt = new Date();
      await session.save();
    }
    return {
      active: true,
      sessionId: String(session._id),
      account: this.account(user),
    };
  }

  async revokeByToken(token: string) {
    const payload = this.payloadOf(token);
    if (!payload) return;
    await this.sessions.updateOne(
      { _id: payload.sid, userId: payload.id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  }

  async listSessions(user: User): Promise<IGameSession[]> {
    const sessions = await this.sessions
      .find({ userId: user._id, revokedAt: null })
      .sort({ lastUsedAt: -1 })
      .lean();
    return sessions.map((session) => ({
      id: String(session._id),
      deviceName: session.deviceName,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt.toISOString(),
    }));
  }

  async revokeSession(user: User, id: string) {
    const result = await this.sessions.updateOne(
      { _id: id, userId: user._id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    if (!result.matchedCount) {
      throw new NotFoundException("This game session does not exist");
    }
  }
}
