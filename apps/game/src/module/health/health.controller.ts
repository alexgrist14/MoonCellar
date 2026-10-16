import { Controller, Get } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { IGameHealth } from "@mooncellar/schemas";
import type { Connection } from "mongoose";
import { GameHealthDto } from "../../shared/zod/dto/game.dto";

const CONNECTED = 1;

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: "Service and database status" })
  @ApiOkResponse({ type: GameHealthDto })
  getHealth(): IGameHealth {
    return {
      status: "ok",
      database: this.connection.readyState === CONNECTED ? "up" : "down",
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
