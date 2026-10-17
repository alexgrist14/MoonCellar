import { JwtService } from "@nestjs/jwt";
import type { ConfigService } from "@nestjs/config";
import { GameAuthService, normalizeUserCode } from "./game-auth.service";

const SECRET = "test-secret";
const USER_ID = "6ad2fba6a8c10296128b6cfc";
const SESSION_ID = "6ad2fbc2a8c10296128b6d20";

const createService = (code: Record<string, unknown> | null) => {
  const codeDoc = code && {
    ...code,
    save: jest.fn(),
    deleteOne: jest.fn(),
  };
  const codes = { findOne: jest.fn().mockResolvedValue(codeDoc) };
  const sessions = {
    create: jest.fn().mockResolvedValue({ _id: SESSION_ID }),
    findOne: jest.fn(),
  };
  const users = {
    findById: jest
      .fn()
      .mockResolvedValue({ _id: USER_ID, userName: "faith", avatar: "" }),
  };
  const jwt = new JwtService({});
  const config = {
    get: (key: string) => (key === "JWT_SECRET" ? SECRET : undefined),
  } as unknown as ConfigService;
  const service = new GameAuthService(
    codes as never,
    sessions as never,
    users as never,
    jwt,
    config
  );
  return { service, codeDoc, sessions, jwt };
};

describe("normalizeUserCode", () => {
  it.each([
    ["abcd-efgh", "ABCD-EFGH"],
    ["abcdefgh", "ABCD-EFGH"],
    [" AB CD-EF GH ", "ABCD-EFGH"],
    ["ABC", "ABC"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeUserCode(input)).toBe(expected);
  });
});

describe("GameAuthService.exchange", () => {
  const future = () => new Date(Date.now() + 60_000);

  it("stays pending until the code is approved", async () => {
    const { service, codeDoc, sessions } = createService({
      expiresAt: future(),
      approvedBy: null,
      deviceName: "PC",
    });
    await expect(service.exchange("device")).resolves.toEqual({
      status: "pending",
    });
    expect(codeDoc!.save).toHaveBeenCalled();
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it("issues a game token that the site key does not accept", async () => {
    const { service, codeDoc, jwt } = createService({
      expiresAt: future(),
      approvedBy: USER_ID,
      deviceName: "PC",
    });
    const result = await service.exchange("device");
    expect(result.status).toBe("approved");
    expect(result.account).toEqual({
      id: USER_ID,
      userName: "faith",
      avatar: null,
    });
    expect(codeDoc!.deleteOne).toHaveBeenCalled();
    expect(
      jwt.verify(result.token!, { secret: `${SECRET}:game` })
    ).toMatchObject({ id: USER_ID, sid: SESSION_ID, typ: "game" });
    expect(() => jwt.verify(result.token!, { secret: SECRET })).toThrow();
  });

  it("rejects an expired code", async () => {
    const { service } = createService({
      expiresAt: new Date(Date.now() - 1000),
      approvedBy: USER_ID,
      deviceName: "PC",
    });
    await expect(service.exchange("device")).rejects.toThrow(/expired/);
  });
});
