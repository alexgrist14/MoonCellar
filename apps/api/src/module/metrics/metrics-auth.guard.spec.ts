import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { MetricsAuthGuard } from "./metrics-auth.guard";

function ctx(auth?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: auth ? { authorization: auth } : {} }),
    }),
  } as unknown as ExecutionContext;
}

describe("MetricsAuthGuard", () => {
  beforeEach(() => {
    process.env.METRICS_TOKEN = "secret";
  });

  it("allows a valid bearer token", () => {
    expect(new MetricsAuthGuard().canActivate(ctx("Bearer secret"))).toBe(true);
  });

  it("rejects a missing token", () => {
    expect(() => new MetricsAuthGuard().canActivate(ctx())).toThrow(
      UnauthorizedException
    );
  });

  it("rejects a wrong token", () => {
    expect(() => new MetricsAuthGuard().canActivate(ctx("Bearer nope"))).toThrow(
      UnauthorizedException
    );
  });
});
