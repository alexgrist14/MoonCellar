import { Module } from "@nestjs/common";

import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./module/auth/auth.module";
import { UserModule } from "./module/user/user.module";
import { IgdbModule } from "./module/igdb/igdb.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { RetroachievementsModule } from "./module/retroach/retroach.module";
import { SteamModule } from "./module/steam/steam.module";
import { GamesModule } from "./module/games/games.module";
import { APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { AdminModule } from "./module/admin/admin.module";
import { FaroModule } from "./module/faro/faro.module";
import { LoggerModule } from "nestjs-pino";
import { pinoConfig } from "./module/logger/logger.module";
import { MetricsModule } from "./module/metrics/metrics.module";
import { HttpMetricsInterceptor } from "./module/metrics/http-metrics.interceptor";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRootAsync(pinoConfig),
    MetricsModule,
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_CONNECTION_STRING, {
      dbName: "games",
      monitorCommands: true,
    }),
    HttpModule,
    AuthModule,
    UserModule,
    AdminModule,
    FaroModule,
    GamesModule,
    IgdbModule,
    RetroachievementsModule,
    SteamModule,
    ServeStaticModule.forRoot({
      rootPath: `/var/www/uploads/photos`,
      serveRoot: "/photos",
    }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
})
export class AppModule {}
