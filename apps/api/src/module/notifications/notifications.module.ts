import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../user/schemas/user.schema";
import { Game, GameDatabaseSchema } from "../games/schemas/game.schema";
import {
  Playthrough,
  PlaythroughDatabaseSchema,
} from "../games/schemas/playthroughs.schema";
import { MetricsModule } from "../metrics/metrics.module";
import { WishlistReleasesService } from "./services/wishlist-releases.service";
import { NotificationsController } from "./controllers/notifications.controller";
import { NotificationsGateway } from "./gateways/notifications.gateway";
import {
  Notification,
  NotificationDatabaseSchema,
} from "./schemas/notification.schema";
import { NotificationsService } from "./services/notifications.service";
import { PushService } from "./services/push.service";
import {
  PushSubscription,
  PushSubscriptionDatabaseSchema,
} from "./schemas/push-subscription.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationDatabaseSchema },
      { name: PushSubscription.name, schema: PushSubscriptionDatabaseSchema },
      { name: User.name, schema: UserSchema },
      { name: Game.name, schema: GameDatabaseSchema },
      { name: Playthrough.name, schema: PlaythroughDatabaseSchema },
    ]),
    MetricsModule,
    JwtModule.register({}),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    PushService,
    WishlistReleasesService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
