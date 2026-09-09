import { Counter, Histogram } from "prom-client";
import { BusinessMetricsService } from "./business-metrics.service";

function build() {
  const syncRuns = new Counter({
    name: "t_sync_runs",
    help: "h",
    labelNames: ["job", "status"],
    registers: [],
  });
  const syncDuration = new Histogram({
    name: "t_sync_duration",
    help: "h",
    labelNames: ["job"],
    buckets: [1, 5],
    registers: [],
  });
  const games = new Counter({
    name: "t_games",
    help: "h",
    labelNames: ["source", "operation"],
    registers: [],
  });
  const registrations = new Counter({ name: "t_reg", help: "h", registers: [] });
  const achievements = new Counter({ name: "t_ach", help: "h", registers: [] });
  return {
    service: new BusinessMetricsService(
      syncRuns,
      syncDuration,
      games,
      registrations,
      achievements
    ),
    syncRuns,
    games,
    registrations,
  };
}

describe("BusinessMetricsService", () => {
  it("records a successful sync run", async () => {
    const { service, syncRuns } = build();
    await service.trackSync("hltb-sync", async () => "ok");
    const data = await syncRuns.get();
    expect(
      data.values.find(
        (v) => v.labels.job === "hltb-sync" && v.labels.status === "success"
      )?.value
    ).toBe(1);
  });

  it("records a failed sync run and rethrows", async () => {
    const { service, syncRuns } = build();
    await expect(
      service.trackSync("igdb-games-sync", async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    const data = await syncRuns.get();
    expect(
      data.values.find((v) => v.labels.status === "error")?.value
    ).toBe(1);
  });

  it("records games added", async () => {
    const { service, games } = build();
    service.recordGames("igdb", "added", 3);
    const data = await games.get();
    expect(
      data.values.find(
        (v) => v.labels.source === "igdb" && v.labels.operation === "added"
      )?.value
    ).toBe(3);
  });
});
