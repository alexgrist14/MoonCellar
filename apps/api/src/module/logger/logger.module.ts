import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerModuleAsyncParams } from "nestjs-pino";

export const pinoConfig: LoggerModuleAsyncParams = {
  imports: [ConfigModule],
  useFactory: () => ({
    pinoHttp: {
      level: "info",
      autoLogging: {
        ignore: (req) => {
          const url = req.url || "";
          return url.startsWith("/metrics") || url.startsWith("/faro");
        },
      },
      customLogLevel: (req, res, err) => {
        if (err && err instanceof Error) return "error";
        if (res?.statusCode >= 500) return "error";
        if (res?.statusCode >= 400) return "warn";
        return "info";
      },
      customSuccessMessage: (req, res) =>
        `${req.method} ${req.url} -> ${res.statusCode}`,
      customErrorMessage: (req, res, err) =>
        `ERROR ${req.method} ${req.url} -> ${res.statusCode}: 
                      ${err?.message}`,
      serializers: {
        req(req) {
          return {
            method: req.method,
            url: req.url,
            ip: req.ip || req.socket?.remoteAddress,
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
            responseTime: res.responseTime,
          };
        },
        err(err) {
          if (!err) return undefined;
          return {
            message: err.message,
          };
        },
      },
      transport: process.env.LOKI_HOST
        ? {
            target: "pino-loki",
            options: {
              host: process.env.LOKI_HOST,
              json: true,
              batch: true,
              labels: { app: "nestjs-loki-grafana" },
              propsToLabels: ["job", "cron"],
            },
          }
        : {
            target: "pino-pretty",
            options: {
              colorize: true,
              singleLine: true,
            },
          },
    },
  }),
  inject: [ConfigService],
};
