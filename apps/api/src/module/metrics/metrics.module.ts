import { Module } from "@nestjs/common";
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from "@willsoto/nestjs-prometheus";
import { MetricsController } from "./metrics.controller";
import { MongoMetricsService } from "./mongo-metrics.service";
import { BusinessMetricsService } from "./business-metrics.service";
import {
  ACHIEVEMENTS_PROCESSED_TOTAL,
  GAMES_SYNCED_TOTAL,
  HTTP_DURATION_BUCKETS,
  HTTP_REQUEST_DURATION,
  HTTP_REQUESTS_TOTAL,
  MONGO_COMMAND_DURATION,
  MONGO_DURATION_BUCKETS,
  SYNC_DURATION,
  SYNC_RUNS_TOTAL,
  USER_REGISTRATIONS_TOTAL,
} from "./metrics.constants";

const metricProviders = [
  makeHistogramProvider({
    name: HTTP_REQUEST_DURATION,
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: HTTP_DURATION_BUCKETS,
  }),
  makeCounterProvider({
    name: HTTP_REQUESTS_TOTAL,
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status_code"],
  }),
  makeHistogramProvider({
    name: MONGO_COMMAND_DURATION,
    help: "MongoDB command duration in seconds",
    labelNames: ["command", "collection", "status"],
    buckets: MONGO_DURATION_BUCKETS,
  }),
  makeCounterProvider({
    name: SYNC_RUNS_TOTAL,
    help: "Sync cron runs",
    labelNames: ["job", "status"],
  }),
  makeHistogramProvider({
    name: SYNC_DURATION,
    help: "Sync cron duration in seconds",
    labelNames: ["job"],
    buckets: [1, 5, 15, 30, 60, 120, 300, 600],
  }),
  makeCounterProvider({
    name: GAMES_SYNCED_TOTAL,
    help: "Games added/updated by sync",
    labelNames: ["source", "operation"],
  }),
  makeCounterProvider({
    name: USER_REGISTRATIONS_TOTAL,
    help: "User registrations",
  }),
  makeCounterProvider({
    name: ACHIEVEMENTS_PROCESSED_TOTAL,
    help: "Achievements processed",
  }),
];

@Module({
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
      defaultMetrics: {
        enabled: process.env.PROMETHEUS_ENABLED !== "false",
        config: { prefix: "mooncellar_" },
      },
    }),
  ],
  providers: [...metricProviders, MongoMetricsService, BusinessMetricsService],
  exports: [...metricProviders, BusinessMetricsService],
})
export class MetricsModule {}
