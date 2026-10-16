import { Module } from "@nestjs/common";
import { PrometheusModule } from "@willsoto/nestjs-prometheus";
import { MetricsController } from "./metrics.controller";

@Module({
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
      defaultMetrics: {
        enabled: process.env.PROMETHEUS_ENABLED !== "false",
        config: { prefix: "mooncellar_game_" },
      },
    }),
  ],
})
export class MetricsModule {}
