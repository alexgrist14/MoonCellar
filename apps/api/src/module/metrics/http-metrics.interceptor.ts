import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter, Histogram } from "prom-client";
import { Observable } from "rxjs";
import { HTTP_REQUEST_DURATION, HTTP_REQUESTS_TOTAL } from "./metrics.constants";

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric(HTTP_REQUEST_DURATION)
    private readonly duration: Histogram<string>,
    @InjectMetric(HTTP_REQUESTS_TOTAL)
    private readonly total: Counter<string>
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();
    const route: string = req.route?.path ?? "unmatched";

    if (route === "/metrics") {
      return next.handle();
    }

    const method: string = req.method;
    const stop = this.duration.startTimer();

    const record = () => {
      res.removeListener("finish", record);
      res.removeListener("close", record);
      const labels = { method, route, status_code: res.statusCode };
      stop(labels);
      this.total.inc(labels);
    };

    res.on("finish", record);
    res.on("close", record);

    return next.handle();
  }
}
