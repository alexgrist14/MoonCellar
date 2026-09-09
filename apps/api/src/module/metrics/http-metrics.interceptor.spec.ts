import { EventEmitter } from "events";
import { of } from "rxjs";
import { Counter, Histogram } from "prom-client";
import { HttpMetricsInterceptor } from "./http-metrics.interceptor";

function makeCtx(routePath: string, statusCode: number) {
  const req = { method: "GET", route: { path: routePath }, url: routePath };
  const res = Object.assign(new EventEmitter(), { statusCode });
  return {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    res,
  };
}

describe("HttpMetricsInterceptor", () => {
  it("records duration and count with the route pattern label on success", async () => {
    const histogram = new Histogram({
      name: "test_http_duration_success",
      help: "h",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.1, 1],
    });
    const counter = new Counter({
      name: "test_http_total_success",
      help: "h",
      labelNames: ["method", "route", "status_code"],
    });
    const interceptor = new HttpMetricsInterceptor(histogram, counter);
    const ctx = makeCtx("/games/:id", 200);

    interceptor.intercept(ctx as any, { handle: () => of("ok") }).subscribe();
    ctx.res.emit("finish");

    const total = await counter.get();
    expect(total.values[0].labels).toMatchObject({
      method: "GET",
      route: "/games/:id",
      status_code: 200,
    });
    expect(total.values[0].value).toBe(1);
  });

  it("records the real status code set by the exception filter on error", async () => {
    const histogram = new Histogram({
      name: "test_http_duration_error",
      help: "h",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.1, 1],
    });
    const counter = new Counter({
      name: "test_http_total_error",
      help: "h",
      labelNames: ["method", "route", "status_code"],
    });
    const interceptor = new HttpMetricsInterceptor(histogram, counter);
    const ctx = makeCtx("/games/:id", 200);

    interceptor.intercept(ctx as any, { handle: () => of("ok") }).subscribe();
    ctx.res.statusCode = 403;
    ctx.res.emit("finish");

    const total = await counter.get();
    expect(total.values[0].labels).toMatchObject({
      method: "GET",
      route: "/games/:id",
      status_code: 403,
    });
    expect(total.values[0].value).toBe(1);
  });

  it("skips the /metrics route", async () => {
    const histogram = new Histogram({
      name: "test_http_duration_skip",
      help: "h",
      labelNames: ["method", "route", "status_code"],
      buckets: [0.1, 1],
    });
    const counter = new Counter({
      name: "test_http_total_skip",
      help: "h",
      labelNames: ["method", "route", "status_code"],
    });
    const interceptor = new HttpMetricsInterceptor(histogram, counter);
    const ctx = makeCtx("/metrics", 200);

    interceptor.intercept(ctx as any, { handle: () => of("ok") }).subscribe();
    ctx.res.emit("finish");

    const total = await counter.get();
    expect(total.values).toHaveLength(0);
  });
});
