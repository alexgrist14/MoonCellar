import { Module } from "@nestjs/common";
import { ActivityGateway } from "./activity.gateway";

@Module({
  providers: [ActivityGateway],
  exports: [ActivityGateway],
})
export class ActivityModule {}
