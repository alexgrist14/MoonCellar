type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  error?: Error | unknown;
  context?: Record<string, unknown>;
  timestamp?: string;
  url?: string;
  userAgent?: string;
  userId?: string;
}

class Logger {
  private lokiHost: string;
  private appName: string;
  private batch: LogEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.lokiHost =
      process.env.NEXT_PUBLIC_LOKI_HOST || "http://localhost:3100";
    this.appName = "mooncellar-frontend";

    // Отправляем накопленные логи при разгрузке страницы
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.flush();
      });
    }
  }

  private getLogLevelNumber(level: LogLevel): number {
    const levels: Record<LogLevel, number> = {
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
    };
    return levels[level];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    };

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        entry.error = { value: String(error) };
      }
    }

    if (context) {
      entry.context = context;
    }

    // Получаем userId из cookies или store если доступно
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";");
      const accessToken = cookies.find((c) =>
        c.trim().startsWith("accessMoonToken=")
      );
      if (accessToken) {
        try {
          const tokenValue = accessToken.split("=")[1];
          if (tokenValue) {
            // Можно декодировать JWT токен для получения userId
            // Но для простоты оставим как есть
            entry.userId = "authenticated";
          }
        } catch {
          // Игнорируем ошибки парсинга
        }
      }
    }

    return entry;
  }

  private async sendToLoki(entries: LogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    try {
      // Группируем логи по stream labels для оптимизации
      const streamsMap = new Map<string, Array<[string, string]>>();

      entries.forEach((entry) => {
        const streamKey = `${entry.level}-${process.env.NODE_ENV || "development"}`;

        if (!streamsMap.has(streamKey)) {
          streamsMap.set(streamKey, []);
        }

        const timestamp = String(Date.now() * 1000000); // nanoseconds timestamp
        const logLine = JSON.stringify({
          level: this.getLogLevelNumber(entry.level),
          msg: entry.message,
          err: entry.error,
          context: entry.context,
          url: entry.url,
          userAgent: entry.userAgent,
          userId: entry.userId,
          timestamp: entry.timestamp,
        });

        streamsMap.get(streamKey)!.push([timestamp, logLine]);
      });

      // Преобразуем Map в массив streams
      const streams = Array.from(streamsMap.entries()).map(
        ([streamKey, values]) => {
          const [level, environment] = streamKey.split("-");
          return {
            stream: {
              app: this.appName,
              level,
              environment,
            },
            values,
          };
        }
      );

      await fetch(`${this.lokiHost}/loki/api/v1/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ streams }),
        keepalive: true, // Отправка даже при закрытии страницы
      });
    } catch (error) {
      // Fallback: логируем в консоль если Loki недоступен
      console.error("Failed to send logs to Loki:", error);
      console.error("Log entries:", entries);
    }
  }

  private addToBatch(entry: LogEntry): void {
    this.batch.push(entry);

    if (this.batch.length >= this.BATCH_SIZE) {
      this.flush();
    } else {
      // Устанавливаем таймаут для отправки батча
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      this.batchTimeout = setTimeout(() => {
        this.flush();
      }, this.BATCH_TIMEOUT);
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    const entriesToSend = [...this.batch];
    this.batch = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    await this.sendToLoki(entriesToSend);
  }

  error(
    message: string,
    error?: Error | unknown,
    context?: Record<string, unknown>
  ): void {
    const entry = this.createLogEntry("error", message, error, context);
    console.error(message, error, context);
    this.addToBatch(entry);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry("warn", message, undefined, context);
    console.warn(message, context);
    this.addToBatch(entry);
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry("info", message, undefined, context);
    console.info(message, context);
    this.addToBatch(entry);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry("debug", message, undefined, context);
    console.debug(message, context);
    this.addToBatch(entry);
  }
}

export const logger = new Logger();
