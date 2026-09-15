import { UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { JwtRefreshGuard } from "./jwt-refresh.guard";

const createContext = () => {
  const res = { clearCookie: jest.fn() };
  const req = { headers: { origin: "https://mooncellar.space" } };
  const context = {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;

  return { res, context };
};

describe("JwtRefreshGuard", () => {
  const guard = new JwtRefreshGuard();

  it("clears the session cookies when the refresh token is rejected", () => {
    const { res, context } = createContext();

    expect(() =>
      guard.handleRequest(null, false, new Error("jwt expired"), context)
    ).toThrow(UnauthorizedException);
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  it("clears the session cookies when the token owner no longer exists", () => {
    const { res, context } = createContext();

    expect(() =>
      guard.handleRequest(new UnauthorizedException(), false, undefined, context)
    ).toThrow(UnauthorizedException);
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  it("keeps the cookies when the user lookup fails", () => {
    const { res, context } = createContext();

    expect(() =>
      guard.handleRequest(new Error("connection lost"), false, undefined, context)
    ).toThrow("connection lost");
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it("passes a verified user through", () => {
    const { res, context } = createContext();
    const user = { _id: "user-id" };

    expect(guard.handleRequest(null, user, undefined, context)).toBe(user);
    expect(res.clearCookie).not.toHaveBeenCalled();
  });
});
