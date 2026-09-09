import { EventEmitter } from "events";
import { Histogram } from "prom-client";
import { MongoMetricsService } from "./mongo-metrics.service";

describe("MongoMetricsService", () => {
  it("records a succeeded command", async () => {
    const client = new EventEmitter();
    const connection: any = { getClient: () => client };
    const histogram = new Histogram({
      name: "test_mongo_duration",
      help: "h",
      labelNames: ["command", "collection", "status"],
      buckets: [0.01, 1],
    });

    const service = new MongoMetricsService(connection, histogram);
    service.onModuleInit();

    client.emit("commandSucceeded", {
      commandName: "find",
      duration: 12,
      requestId: 1,
      reply: {},
      address: "x",
    });
    (client as any).lastCommand = { find: "games" };

    const data = await histogram.get();
    const found = data.values.find((v) => v.labels.status === "success");
    expect(found).toBeTruthy();
  });

  it("correlates a started command with its collection and records ms as seconds", async () => {
    const client = new EventEmitter();
    const connection: any = { getClient: () => client };
    const histogram = new Histogram({
      name: "test_mongo_duration_2",
      help: "h",
      labelNames: ["command", "collection", "status"],
      buckets: [0.01, 1],
    });

    const service = new MongoMetricsService(connection, histogram);
    service.onModuleInit();

    client.emit("commandStarted", {
      requestId: 1,
      commandName: "find",
      command: { find: "games" },
    });
    client.emit("commandSucceeded", {
      requestId: 1,
      commandName: "find",
      duration: 12,
    });

    const data = await histogram.get();
    const found = data.values.find(
      (v) =>
        v.labels.command === "find" &&
        v.labels.collection === "games" &&
        v.labels.status === "success"
    );
    expect(found).toBeTruthy();

    const sum = data.values.find((v) => v.metricName?.endsWith("_sum"));
    expect(sum?.value).toBeCloseTo(0.012);
  });

  it("falls back to unknown collection when the command value is not a string", async () => {
    const client = new EventEmitter();
    const connection: any = { getClient: () => client };
    const histogram = new Histogram({
      name: "test_mongo_duration_3",
      help: "h",
      labelNames: ["command", "collection", "status"],
      buckets: [0.01, 1],
    });

    const service = new MongoMetricsService(connection, histogram);
    service.onModuleInit();

    client.emit("commandStarted", {
      requestId: 2,
      commandName: "getMore",
      command: { getMore: 999 },
    });
    client.emit("commandFailed", {
      requestId: 2,
      commandName: "getMore",
      duration: 5,
    });

    const data = await histogram.get();
    const found = data.values.find(
      (v) => v.labels.collection === "unknown" && v.labels.status === "error"
    );
    expect(found).toBeTruthy();
  });

  it("removes the requestId from the collections map after the command completes", async () => {
    const client = new EventEmitter();
    const connection: any = { getClient: () => client };
    const histogram = new Histogram({
      name: "test_mongo_duration_4",
      help: "h",
      labelNames: ["command", "collection", "status"],
      buckets: [0.01, 1],
    });

    const service = new MongoMetricsService(connection, histogram);
    service.onModuleInit();

    client.emit("commandStarted", {
      requestId: 1,
      commandName: "find",
      command: { find: "games" },
    });
    client.emit("commandSucceeded", {
      requestId: 1,
      commandName: "find",
      duration: 12,
    });

    expect((service as any).collections.has(1)).toBe(false);
  });
});
