import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Connection } from "mongoose";
import { Histogram } from "prom-client";
import { MONGO_COMMAND_DURATION } from "./metrics.constants";

@Injectable()
export class MongoMetricsService implements OnModuleInit {
  private readonly collections = new Map<number, string>();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectMetric(MONGO_COMMAND_DURATION)
    private readonly duration: Histogram<string>
  ) {}

  onModuleInit(): void {
    const client: any = this.connection.getClient();

    client.on("commandStarted", (event: any) => {
      const collection =
        typeof event.command?.[event.commandName] === "string"
          ? event.command[event.commandName]
          : "unknown";
      this.collections.set(event.requestId, collection);
    });

    client.on("commandSucceeded", (event: any) => {
      this.record(event, "success");
    });

    client.on("commandFailed", (event: any) => {
      this.record(event, "error");
    });
  }

  private record(event: any, status: string): void {
    const collection = this.collections.get(event.requestId) ?? "unknown";
    this.collections.delete(event.requestId);
    this.duration.observe(
      { command: event.commandName, collection, status },
      event.duration / 1000
    );
  }
}
