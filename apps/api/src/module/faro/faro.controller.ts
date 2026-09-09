import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { FaroService } from "./faro.service";

@ApiTags("Faro")
@Controller("faro")
export class FaroController {
  constructor(private readonly faroService: FaroService) {}

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: "Ingest frontend Faro telemetry" })
  async collect(@Body() body: unknown): Promise<void> {
    await this.faroService.forward(body);
  }
}
