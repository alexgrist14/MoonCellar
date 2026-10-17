export const GHOST_VERSION = 3;
const POSE_BYTES = 18;
const FRAME_BYTES = 2 + POSE_BYTES;
const FIXED_ONE = 65536;

export const GHOST_LIMITS = {
  maxFrameGapMs: 2000,
  lateFinishMs: 750,
  idleMeters: 0.05,
  maxSpeedMetersPerSecond: 35,
  minSegmentMs: 100,
  segmentSlackMeters: 1,
  respawnRadiusMeters: 12,
  cruiseMetersPerSecond: 11,
  maxFastShare: 0.25,
};

export type IGhostFrame = { dt: number; x: number; y: number; z: number };

export type IGhostRun = {
  frames: IGhostFrame[];
  durationMs: number;
};

export const parseGhost = (data: Buffer): IGhostRun | string => {
  if (data.length < 1 + 4 + POSE_BYTES) return "The run is too short";
  if (data.readUInt8(0) !== GHOST_VERSION) return "Unknown run format";
  const count = data.readInt32BE(1);
  if (count < 2) return "The run has no movement";
  if (data.length !== 1 + 4 + POSE_BYTES + FRAME_BYTES * (count - 1)) {
    return "The run is damaged";
  }
  const frames: IGhostFrame[] = [];
  let offset = 5;
  let durationMs = 0;
  for (let index = 0; index < count; index++) {
    const dt = index === 0 ? 0 : data.readUInt16BE(offset);
    if (index > 0) offset += 2;
    frames.push({
      dt,
      x: data.readInt32BE(offset) / FIXED_ONE,
      y: data.readInt32BE(offset + 4) / FIXED_ONE,
      z: data.readInt32BE(offset + 8) / FIXED_ONE,
    });
    offset += POSE_BYTES;
    durationMs += dt;
  }
  return { frames, durationMs };
};

const distance = (a: IGhostFrame, b: IGhostFrame) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export const movingDuration = (run: IGhostRun) => {
  let idleMs = 0;
  for (let index = 1; index < run.frames.length; index++) {
    if (
      distance(run.frames[index - 1], run.frames[index]) >=
      GHOST_LIMITS.idleMeters
    ) {
      break;
    }
    idleMs += run.frames[index].dt;
  }
  return run.durationMs - idleMs;
};

export const checkRun = (run: IGhostRun, timeMs: number): string | null => {
  const limits = GHOST_LIMITS;
  if (movingDuration(run) > timeMs + limits.lateFinishMs) {
    return "The run is longer than the submitted time";
  }
  let movingMs = 0;
  let fastMs = 0;
  for (let index = 1; index < run.frames.length; index++) {
    const frame = run.frames[index];
    if (frame.dt > limits.maxFrameGapMs) return "The run has a gap";
    const previous = run.frames[index - 1];
    const covered = distance(previous, frame);
    const reach =
      (limits.maxSpeedMetersPerSecond *
        Math.max(frame.dt, limits.minSegmentMs)) /
        1000 +
      limits.segmentSlackMeters;
    if (covered > reach) {
      const respawned = run.frames
        .slice(0, index)
        .some(
          (earlier) => distance(earlier, frame) <= limits.respawnRadiusMeters
        );
      if (!respawned) return "The run moves faster than the runner can";
      continue;
    }
    if (frame.dt < limits.minSegmentMs || covered < limits.idleMeters) {
      continue;
    }
    movingMs += frame.dt;
    if ((covered * 1000) / frame.dt > limits.cruiseMetersPerSecond) {
      fastMs += frame.dt;
    }
  }
  if (movingMs > 0 && fastMs / movingMs > limits.maxFastShare) {
    return "The run is faster than the runner can keep up";
  }
  return null;
};
