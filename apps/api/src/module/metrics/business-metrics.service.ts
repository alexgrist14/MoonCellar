import { Injectable } from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Histogram } from "prom-client";
import {
  ACHIEVEMENTS_PROCESSED_TOTAL,
  GAMES_SYNCED_TOTAL,
  SYNC_DURATION,
  SYNC_RUNS_TOTAL,
  USER_REGISTRATIONS_TOTAL,
} from "./metrics.constants";

@Injectable()
export class BusinessMetricsService {
  constructor(
    @InjectMetric(SYNC_RUNS_TOTAL)
    private readonly syncRuns: Counter<string>,
    @InjectMetric(SYNC_DURATION)
    private readonly syncDuration: Histogram<string>,
    @InjectMetric(GAMES_SYNCED_TOTAL)
    private readonly games: Counter<string>,
    @InjectMetric(USER_REGISTRATIONS_TOTAL)
    private readonly registrations: Counter<string>,
    @InjectMetric(ACHIEVEMENTS_PROCESSED_TOTAL)
    private readonly achievements: Counter<string>
  ) {}

  async trackSync<T>(job: string, fn: () => Promise<T>): Promise<T> {
    const stop = this.syncDuration.startTimer({ job });
    try {
      const result = await fn();
      this.syncRuns.inc({ job, status: "success" });
      return result;
    } catch (err) {
      this.syncRuns.inc({ job, status: "error" });
      throw err;
    } finally {
      stop();
    }
  }

  recordGames(source: string, operation: "added" | "updated", count: number): void {
    if (count > 0) {
      this.games.inc({ source, operation }, count);
    }
  }

  recordRegistration(): void {
    this.registrations.inc();
  }

  recordAchievements(count: number): void {
    if (count > 0) {
      this.achievements.inc(count);
    }
  }
}
