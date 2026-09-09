import { Module } from "@nestjs/common";
import { FaroController } from "./faro.controller";
import { FaroService } from "./faro.service";

@Module({
  controllers: [FaroController],
  providers: [FaroService],
})
export class FaroModule {}
