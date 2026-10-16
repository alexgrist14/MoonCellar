import { Controller, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { PrometheusController } from "@willsoto/nestjs-prometheus";
import { MetricsAuthGuard } from "./metrics-auth.guard";

@ApiExcludeController()
@Controller()
@UseGuards(MetricsAuthGuard)
export class MetricsController extends PrometheusController {}
