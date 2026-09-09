import { Controller, UseGuards } from "@nestjs/common";
import { PrometheusController } from "@willsoto/nestjs-prometheus";
import { MetricsAuthGuard } from "./metrics-auth.guard";

@Controller()
@UseGuards(MetricsAuthGuard)
export class MetricsController extends PrometheusController {}
