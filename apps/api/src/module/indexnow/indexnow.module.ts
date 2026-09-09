import { Module } from "@nestjs/common";
import { IndexNowService } from "./indexnow.service";

@Module({
  providers: [IndexNowService],
  exports: [IndexNowService],
})
export class IndexNowModule {}
