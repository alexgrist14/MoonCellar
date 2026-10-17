import { Module } from "@nestjs/common";
import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { LoggerModule } from "nestjs-pino";
import { ZodValidationPipe } from "nestjs-zod";
import { AccountModule } from "./module/account/account.module";
import { ChallengesModule } from "./module/challenges/challenges.module";
import { GamesModule } from "./games/games.module";
import { HealthModule } from "./module/health/health.module";
import { LeaderboardsModule } from "./module/leaderboards/leaderboards.module";
import { pinoConfig } from "./module/logger/logger.module";
import { MetricsModule } from "./module/metrics/metrics.module";
import { SignalModule } from "./module/signal/signal.module";
import { ErrorResponseFilter } from "./shared/error-response.filter";

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRootAsync(pinoConfig),
    MetricsModule,
    MongooseModule.forRoot(process.env.MONGO_CONNECTION_STRING, {
      dbName: "game",
    }),
    HealthModule,
    GamesModule,
    AccountModule,
    LeaderboardsModule,
    ChallengesModule,
    SignalModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ErrorResponseFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
