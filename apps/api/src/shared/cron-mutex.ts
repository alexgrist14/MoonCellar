import { randomUUID } from "node:crypto";
import type { Connection } from "mongoose";

const DB_LOCK_TTL_MS = 10 * 60 * 1000;
const DUPLICATE_KEY = 11000;

let cronQueue: Promise<unknown> = Promise.resolve();

export function runCronExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = cronQueue.then(fn);
  cronQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function withDbLock<T>(
  connection: Connection,
  name: string,
  fn: () => Promise<T>
): Promise<{ locked: false } | { locked: true; result: T }> {
  const locks = connection.collection<{
    _id: string;
    owner: string;
    lockedUntil: Date;
  }>("locks");
  const owner = randomUUID();
  const lease = () => new Date(Date.now() + DB_LOCK_TTL_MS);

  try {
    await locks.updateOne(
      { _id: name, lockedUntil: { $lt: new Date() } },
      { $set: { owner, lockedUntil: lease() } },
      { upsert: true }
    );
  } catch (err) {
    if ((err as { code?: number }).code === DUPLICATE_KEY) {
      return { locked: false };
    }
    throw err;
  }

  const renew = setInterval(() => {
    locks
      .updateOne({ _id: name, owner }, { $set: { lockedUntil: lease() } })
      .catch(() => undefined);
  }, DB_LOCK_TTL_MS / 3);

  try {
    return { locked: true, result: await fn() };
  } finally {
    clearInterval(renew);
    await locks.deleteOne({ _id: name, owner }).catch(() => undefined);
  }
}
