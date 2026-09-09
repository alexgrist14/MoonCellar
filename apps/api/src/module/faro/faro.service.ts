import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class FaroService {
  private readonly logger = new Logger(FaroService.name);
  private readonly collectorUrl =
    process.env.FARO_COLLECTOR_URL || "http://localhost:12347/collect";

  async forward(body: unknown): Promise<void> {
    try {
      const response = await fetch(this.collectorUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(
          `Faro collector responded ${response.status}: ${text}`
        );
      }
    } catch (err) {
      this.logger.error(err, "Failed to reach Faro collector");
    }
  }
}
