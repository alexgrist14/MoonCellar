import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { UserSchema } from "../user/schemas/user.schema";
import { GameAuthController } from "./game-auth.controller";
import { GameAuthService } from "./game-auth.service";
import {
  GameDeviceCode,
  GameDeviceCodeSchema,
} from "./schemas/game-device-code.schema";
import { GameSession, GameSessionSchema } from "./schemas/game-session.schema";

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: GameDeviceCode.name, schema: GameDeviceCodeSchema },
      { name: GameSession.name, schema: GameSessionSchema },
      { name: "User", schema: UserSchema },
    ]),
  ],
  controllers: [GameAuthController],
  providers: [GameAuthService],
})
export class GameAuthModule {}
