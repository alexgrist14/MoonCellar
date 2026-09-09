import { PinoLogger } from "nestjs-pino";
import { storage, Store } from "nestjs-pino/storage";

export function runInCronLogContext<T>(
  pino: PinoLogger,
  cron: string,
  fn: () => Promise<T>
): Promise<T> {
  const child = pino.logger.child({ job: "cron", cron });
  return storage.run(new Store(child), fn);
}
