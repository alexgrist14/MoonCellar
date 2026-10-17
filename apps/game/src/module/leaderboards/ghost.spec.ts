import { describe, expect, it } from "bun:test";
import { GHOST_VERSION, checkRun, parseGhost } from "./ghost";

type IPoint = { dt: number; x: number; y?: number; z?: number };

const encode = (points: IPoint[], version = GHOST_VERSION) => {
  const data = Buffer.alloc(1 + 4 + 18 + 20 * (points.length - 1));
  data.writeUInt8(version, 0);
  data.writeInt32BE(points.length, 1);
  let offset = 5;
  points.forEach((point, index) => {
    if (index > 0) {
      data.writeUInt16BE(point.dt, offset);
      offset += 2;
    }
    data.writeInt32BE(Math.trunc(point.x * 65536), offset);
    data.writeInt32BE(Math.trunc((point.y ?? 0) * 65536), offset + 4);
    data.writeInt32BE(Math.trunc((point.z ?? 0) * 65536), offset + 8);
    data.writeUInt16BE(1, offset + 12);
    data.writeInt32BE(0, offset + 14);
    offset += 18;
  });
  return data;
};

const runAt = (metersPerSecond: number, seconds: number) =>
  Array.from({ length: seconds * 2 + 1 }, (_, index) => ({
    dt: index === 0 ? 0 : 500,
    x: (index * metersPerSecond) / 2,
  }));

const parse = (points: IPoint[]) => {
  const run = parseGhost(encode(points));
  if (typeof run === "string") throw new Error(run);
  return run;
};

describe("parseGhost", () => {
  it("reads frames and the duration", () => {
    const run = parse(runAt(6, 10));
    expect(run.frames).toHaveLength(21);
    expect(run.durationMs).toBe(10_000);
    expect(run.frames[20].x).toBe(60);
  });

  it("rejects another version and a cut file", () => {
    expect(parseGhost(encode(runAt(6, 2), 2))).toBe("Unknown run format");
    expect(parseGhost(encode(runAt(6, 2)).subarray(0, 40))).toBe(
      "The run is damaged"
    );
  });
});

describe("checkRun", () => {
  it("accepts a run that matches its time", () => {
    expect(checkRun(parse(runAt(9.5, 10)), 10_300)).toBeNull();
  });

  it("does not count standing at the start, before the race clock runs", () => {
    const standing = Array.from({ length: 10 }, (_, index) => ({
      dt: index === 0 ? 0 : 500,
      x: 0,
    }));
    const run = runAt(9.5, 10).map((point, index) => ({
      ...point,
      dt: index === 0 ? 500 : point.dt,
    }));
    expect(checkRun(parse([...standing, ...run]), 10_000)).toBeNull();
  });

  it("rejects a time shorter than the run", () => {
    expect(checkRun(parse(runAt(9.5, 10)), 8_000)).toBe(
      "The run is longer than the submitted time"
    );
  });

  it("rejects a run kept above the runner's pace", () => {
    expect(checkRun(parse(runAt(11.5, 10)), 10_000)).toBe(
      "The run is faster than the runner can keep up"
    );
  });

  it("rejects a jump ahead but allows a respawn at an earlier spot", () => {
    const teleport = runAt(9.5, 4);
    teleport[5] = { dt: 500, x: 300 };
    expect(checkRun(parse(teleport), 4_000)).toBe(
      "The run moves faster than the runner can"
    );

    const respawn = runAt(9.5, 4);
    respawn[6] = { dt: 500, x: 5 };
    expect(checkRun(parse(respawn), 4_000)).toBeNull();
  });
});
