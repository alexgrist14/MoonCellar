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
} from "@mooncellar/schemas";
import { User } from "../schemas/user.schema";
import { RA_MAIN_USER_NAME } from "../../../shared/constants";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";

const RA_SYNC_COOLDOWN_MS = 60 * 1000;

@Injectable()
export class UserRAService {
  private readonly logger = new Logger(UserRAService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly metrics: BusinessMetricsService
  ) {}
  private readonly username = RA_MAIN_USER_NAME;
  private readonly webApiKey = process.env.RETROACHIEVEMENTS_API_KEY;
  private readonly authorization = buildAuthorization({
    username: this.username,
    webApiKey: this.webApiKey,
  });

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

    return { awards: user.raAwards.length, syncedAt: user.raSyncedAt };
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
