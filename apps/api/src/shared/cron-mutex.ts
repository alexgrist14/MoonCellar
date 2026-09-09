let cronQueue: Promise<unknown> = Promise.resolve();

export function runCronExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = cronQueue.then(fn);
  cronQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
