import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import mongoose, { type FilterQuery, Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import { runCronExclusive } from "../../../shared/cron-mutex";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import {
  type IPlaythroughDocument,
  Playthrough,
} from "../../games/schemas/playthroughs.schema";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import {
  EXACT_RELEASE_DAY_PATTERN,
  PLACEHOLDER_RELEASE_DAY_PATTERN,
  WISHLIST_RELEASE_CRON,
  WISHLIST_RELEASE_CRON_OPTIONS,
} from "../constants/notifications.constants";
import {
  Notification,
  type NotificationDocument,
} from "../schemas/notification.schema";
import { NotificationsService } from "./notifications.service";

const DAY_SECONDS = 24 * 60 * 60;

type IReleasedGame = {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  first_release: number;
  release_dates?: { date: number; human: string }[];
};

const isExactDay = (human?: string) =>
  !!human &&
  EXACT_RELEASE_DAY_PATTERN.test(human) &&
  !PLACEHOLDER_RELEASE_DAY_PATTERN.test(human);

@Injectable()
export class WishlistReleasesService {
  private readonly logger = new Logger(WishlistReleasesService.name);

  constructor(
    @InjectModel(Game.name) private readonly games: Model<GameDocument>,
    @InjectModel(Playthrough.name)
    private readonly playthroughs: Model<IPlaythroughDocument>,
    @InjectModel(Notification.name)
    private readonly notificationsModel: Model<NotificationDocument>,
    private readonly notifications: NotificationsService,
    private readonly pino: PinoLogger,
    private readonly metrics: BusinessMetricsService
  ) {}

  @Cron(WISHLIST_RELEASE_CRON, WISHLIST_RELEASE_CRON_OPTIONS)
  async notifyCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.pino, WISHLIST_RELEASE_CRON_OPTIONS.name, () =>
        this.metrics.trackSync(WISHLIST_RELEASE_CRON_OPTIONS.name, () =>
          this.notifyReleasedToday()
        )
      )
    );
  }

  async notifyReleasedToday(now = new Date()) {
    const dayStart =
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) /
      1000;

    const released = (
      await this.games
        .find({
          first_release: { $gte: dayStart, $lt: dayStart + DAY_SECONDS },
        })
        .select("slug name first_release release_dates")
        .lean<IReleasedGame[]>()
    ).filter((game) =>
      isExactDay(
        game.release_dates?.find(({ date }) => date === game.first_release)
          ?.human
      )
    );

    if (!released.length) {
      this.logger.log("Wishlist releases: no games released today");
      return { games: 0, sent: 0 };
    }

    const gameIds = released.map((game) => game._id);
    const [wishes, alreadySent] = await Promise.all([
      this.playthroughs
        .find({
          gameId: { $in: gameIds },
          category: "wishlist",
        } as FilterQuery<IPlaythroughDocument>)
        .select("userId gameId")
        .lean<
          { userId: mongoose.Types.ObjectId; gameId: mongoose.Types.ObjectId }[]
        >(),
      this.notificationsModel
        .find({ type: "wishlist-release", subjectId: { $in: gameIds } })
        .select("userId subjectId")
        .lean(),
    ]);

    const sentKeys = new Set(
      alreadySent.map(({ userId, subjectId }) => `${userId}:${subjectId}`)
    );
    const gamesById = new Map(released.map((game) => [String(game._id), game]));
    let sent = 0;

    for (const { userId, gameId } of wishes) {
      const key = `${userId}:${gameId}`;
      const game = gamesById.get(String(gameId));

      if (!game || sentKeys.has(key)) continue;

      sentKeys.add(key);
      await this.notifications.notify({
        userId,
        type: "wishlist-release",
        subjectId: gameId,
        payload: { gameSlug: game.slug, gameName: game.name },
      });
      sent++;
    }

    this.logger.log(
      `Wishlist releases: ${released.length} games released today, ${sent} notifications`
    );

    return { games: released.length, sent };
  }
}
