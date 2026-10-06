import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  buildAuthorization,
  getAchievementsEarnedBetween,
  getUserAwards,
  getUserProfile,
} from "@retroachievements/api";
import mongoose, { Model } from "mongoose";
import {
  RA_CONNECT_CODE_TTL_MINUTES,
  type IRaConnectResponse,
  type IRaGameStatus,
  type IRaUserGame,
} from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import { User } from "../schemas/user.schema";
import { RA_MAIN_USER_NAME } from "../../../shared/constants";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import {
  RaPlaythroughsService,
  pickGamesForSets,
} from "../../retroach/services/ra-playthroughs.service";
import {
  Playthrough,
  type IPlaythroughDocument,
} from "../../games/schemas/playthroughs.schema";
import { Rating } from "../schemas/user-ratings.schema";

const RA_SYNC_COOLDOWN_MS = 60 * 1000;

const RA_STATUS_RANK: IRaGameStatus[] = [
  "mastered",
  "completed",
  "beaten",
  "beaten-softcore",
];

const toRaStatus = (
  awardType: string,
  isHardcore: boolean
): IRaGameStatus | null => {
  if (awardType === "Mastery/Completion") {
    return isHardcore ? "mastered" : "completed";
  }

  if (awardType === "Game Beaten") {
    return isHardcore ? "beaten" : "beaten-softcore";
  }

  return null;
};

@Injectable()
export class UserRAService {
  private readonly logger = new Logger(UserRAService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(Playthrough.name)
    private playthroughModel: Model<IPlaythroughDocument>,
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    private readonly metrics: BusinessMetricsService,
    private readonly raPlaythroughs: RaPlaythroughsService
  ) {}
  private readonly username = RA_MAIN_USER_NAME;
  private readonly webApiKey = process.env.RETROACHIEVEMENTS_API_KEY;
  private readonly authorization = buildAuthorization({
    username: this.username,
    webApiKey: this.webApiKey,
  });

  async getUserGames(userId: string): Promise<IRaUserGame[]> {
    if (!mongoose.isValidObjectId(userId)) {
      throw new BadRequestException(`Invalid user id: ${userId}`);
    }

    const user = await this.userModel
      .findById(userId)
      .select("raAwards")
      .lean();

    if (!user) throw new NotFoundException("User not found");

    const bySet = new Map<number, { status: IRaGameStatus; date: string }>();

    for (const award of user.raAwards ?? []) {
      const status = toRaStatus(award.awardType, award.awardDataExtra === 1);

      if (!status) continue;

      const current = bySet.get(award.awardData);

      if (
        !current ||
        RA_STATUS_RANK.indexOf(status) < RA_STATUS_RANK.indexOf(current.status)
      ) {
        bySet.set(award.awardData, { status, date: award.awardedAt });
      }
    }

    if (!bySet.size) return [];

    const games = await this.gameModel
      .find({ "retroachievements.gameId": { $in: [...bySet.keys()] } })
      .select("_id retroachievements ratingsCount")
      .lean();
    const gameIds = games.map(({ _id }) => _id);
    const anyId = (ids: unknown[]) => ({ $in: [...ids, ...ids.map(String)] });
    const [plays, ratings] = await Promise.all([
      this.playthroughModel
        .find({ userId: anyId([user._id]), gameId: anyId(gameIds) })
        .select("gameId")
        .lean(),
      this.ratingModel
        .find({ userId: anyId([user._id]), gameId: anyId(gameIds) })
        .select("gameId")
        .lean(),
    ]);
    const pickedBySet = pickGamesForSets(
      games,
      bySet.keys(),
      new Set(plays.map(({ gameId }) => String(gameId))),
      new Set(ratings.map(({ gameId }) => String(gameId)))
    );
    const bestByGame = new Map<string, IRaUserGame>();

    for (const [raGameId, game] of pickedBySet) {
      const { status, date } = bySet.get(raGameId)!;
      const gameId = String(game._id);
      const current = bestByGame.get(gameId);

      if (
        !current ||
        RA_STATUS_RANK.indexOf(status) < RA_STATUS_RANK.indexOf(current.status)
      ) {
        bestByGame.set(gameId, { gameId, raGameId, status, awardedAt: date });
      }
    }

    return [...bestByGame.values()].sort(
      (a, b) =>
        RA_STATUS_RANK.indexOf(a.status) - RA_STATUS_RANK.indexOf(b.status) ||
        b.awardedAt.localeCompare(a.awardedAt)
    );
  }

  async getUserAchievements(raUsername: string) {
    try {
      //const authorization = buildAuthorization({userName: this.username, webApiKey: this.webApiKey});

      const achievements = await getAchievementsEarnedBetween(
        this.authorization,
        {
          username: raUsername,
          fromDate: new Date("2024-01-01"),
          toDate: new Date("2026-01-01"),
        }
      );

      this.metrics.recordAchievements(achievements.length);

      return achievements;
    } catch (err) {
      this.logger.error(err, `Failed to get user achievements: ${raUsername}`);
      throw err;
    }
  }

  // async getUserAwards(raUsername: string){
  //   const userAwards = await getUserAwards(this.authorization,{
  //     userName: raUsername
  //   })

  //   return userAwards.visibleUserAwards;

  // }

  private async fetchProfile(username: string) {
    try {
      const profile = await getUserProfile(this.authorization, { username });

      return profile?.user
        ? {
            username: profile.user,
            ulid: (profile as { ulid?: string }).ulid ?? null,
            userPic: profile.userPic
              ? `https://media.retroachievements.org${profile.userPic}`
              : null,
            motto: profile.motto ?? "",
          }
        : null;
    } catch (err) {
      this.logger.warn(`RA profile lookup failed for ${username}: ${err}`);
      return null;
    }
  }

  async startConnect(
    userId: mongoose.Types.ObjectId,
    rawUsername: string
  ): Promise<IRaConnectResponse> {
    const profile = await this.fetchProfile(rawUsername.trim());

    if (!profile) {
      throw new NotFoundException(
        `RetroAchievements user "${rawUsername}" not found`
      );
    }

    const pending = {
      username: profile.username,
      code: `mooncellar-${randomBytes(4).toString("hex")}`,
      expiresAt: new Date(
        Date.now() + RA_CONNECT_CODE_TTL_MINUTES * 60 * 1000
      ).toISOString(),
    };

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { raPending: pending } }
    );

    return pending;
  }

  async verifyConnect(userId: mongoose.Types.ObjectId) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException("User not found");

    const pending = user.raPending;

    if (!pending) {
      throw new BadRequestException(
        "Start connecting a RetroAchievements account first"
      );
    }

    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException(
        "The code has expired. Start connecting again to get a new one"
      );
    }

    const profile = await this.fetchProfile(pending.username);

    if (!profile) {
      throw new NotFoundException(
        `RetroAchievements user "${pending.username}" not found`
      );
    }

    if (!profile.motto.includes(pending.code)) {
      throw new BadRequestException(
        `The code was not found in the motto of ${profile.username}. Save it in your RetroAchievements settings and try again`
      );
    }

    const owner = await this.userModel
      .findOne({
        _id: { $ne: user._id },
        raVerifiedAt: { $exists: true, $ne: null },
        ...(profile.ulid
          ? { raUlid: profile.ulid }
          : { raUsername: profile.username }),
      })
      .select("userName")
      .lean();

    if (owner) {
      throw new ConflictException(
        `${profile.username} is already connected to another MoonCellar account`
      );
    }

    const awards = await getUserAwards(this.authorization, {
      username: profile.ulid ?? profile.username,
    });

    user.raUsername = profile.username;
    user.raUlid = profile.ulid ?? undefined;
    user.raUserPic = profile.userPic ?? undefined;
    user.raVerifiedAt = new Date().toISOString();
    user.raSyncedAt = user.raVerifiedAt;
    user.raPending = null;
    user.raAwards = awards.visibleUserAwards;

    await user.save();
    await this.raPlaythroughs.sync(user._id as mongoose.Types.ObjectId);

    return { username: profile.username };
  }

  async syncAwards(userId: mongoose.Types.ObjectId) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException("User not found");

    if (!user.raVerifiedAt || !user.raUsername) {
      throw new BadRequestException(
        "Connect a RetroAchievements account first"
      );
    }

    const lastSync = user.raSyncedAt ? new Date(user.raSyncedAt).getTime() : 0;

    if (Date.now() - lastSync < RA_SYNC_COOLDOWN_MS) {
      throw new BadRequestException(
        "Awards were updated less than a minute ago, try again shortly"
      );
    }

    const lookup = user.raUlid ?? user.raUsername;
    const [profile, awards] = await Promise.all([
      this.fetchProfile(lookup),
      getUserAwards(this.authorization, { username: lookup }),
    ]);

    if (profile) {
      user.raUsername = profile.username;
      user.raUserPic = profile.userPic ?? undefined;
    }

    user.raAwards = awards.visibleUserAwards;
    user.raSyncedAt = new Date().toISOString();

    await user.save();

    const playthroughs = await this.raPlaythroughs.sync(
      user._id as mongoose.Types.ObjectId
    );

    return {
      awards: user.raAwards.length,
      syncedAt: user.raSyncedAt,
      ...playthroughs,
    };
  }

  syncPlaythroughs(userId: mongoose.Types.ObjectId) {
    return this.raPlaythroughs.sync(userId);
  }

  async disconnect(userId: mongoose.Types.ObjectId) {
    const { matchedCount } = await this.userModel.updateOne(
      { _id: userId },
      {
        $unset: {
          raUsername: "",
          raUlid: "",
          raUserPic: "",
          raVerifiedAt: "",
          raSyncedAt: "",
        },
        $set: { raPending: null, raAwards: [] },
      }
    );

    if (!matchedCount) throw new NotFoundException("User not found");

    return { status: "disconnected" as const };
  }
}
