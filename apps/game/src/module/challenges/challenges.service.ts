import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  IGameAccount,
  IGameChallenge,
  IGameChallengeCreate,
  IGameChallengeWithGhost,
} from "@mooncellar/schemas";
import type { Model } from "mongoose";
import { AccountService } from "../account/account.service";
import { LeaderboardsService } from "../leaderboards/leaderboards.service";
import { Challenge } from "./schemas/challenge.schema";

const LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_UNDELIVERED_PER_PAIR = 5;

type ILeanChallenge = Challenge & { _id: { toString(): string } };

const toChallenge = (row: ILeanChallenge): IGameChallenge => ({
  id: row._id.toString(),
  fromUserId: row.fromUserId,
  fromName: row.fromName,
  toUserId: row.toUserId,
  level: row.level,
  timeMs: row.timeMs,
  comment: row.comment,
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class ChallengesService {
  constructor(
    @InjectModel(Challenge.name)
    private readonly challenges: Model<Challenge>,
    private readonly accounts: AccountService,
    private readonly leaderboards: LeaderboardsService
  ) {}

  async create(
    from: IGameAccount,
    dto: IGameChallengeCreate
  ): Promise<IGameChallenge> {
    const friends = await this.accounts.friendsOf(from.id);
    if (!friends.some((friend) => friend.id === dto.toUserId)) {
      throw new ForbiddenException(
        "You can challenge only people you follow or who follow you"
      );
    }
    const ghost = Buffer.from(dto.ghost, "base64");
    const rejection = await this.leaderboards.checkSubmittedRun(
      dto.level,
      ghost,
      dto.timeMs
    );
    if (rejection) {
      throw new UnprocessableEntityException(
        `${rejection}. The challenge was not sent`
      );
    }
    const waiting = await this.challenges.countDocuments({
      fromUserId: from.id,
      toUserId: dto.toUserId,
      deliveredAt: null,
    });
    if (waiting >= MAX_UNDELIVERED_PER_PAIR) {
      throw new HttpException(
        "This friend has not opened your earlier challenges yet",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
    const created = await this.challenges.create({
      fromUserId: from.id,
      fromName: from.userName,
      toUserId: dto.toUserId,
      level: dto.level,
      timeMs: dto.timeMs,
      comment: dto.comment,
      ghost,
      expiresAt: new Date(Date.now() + LIFETIME_MS),
    });
    return toChallenge(created.toObject() as ILeanChallenge);
  }

  async takeIncoming(account: IGameAccount): Promise<IGameChallenge[]> {
    const rows = await this.challenges
      .find({ toUserId: account.id, deliveredAt: null })
      .sort({ createdAt: 1 })
      .limit(20)
      .lean<ILeanChallenge[]>();
    if (rows.length) {
      await this.challenges.updateMany(
        { _id: { $in: rows.map((row) => row._id) } },
        { $set: { deliveredAt: new Date() } }
      );
    }
    return rows.map(toChallenge);
  }

  async get(
    account: IGameAccount,
    challengeId: string
  ): Promise<IGameChallengeWithGhost> {
    const row = await this.challenges.findById(challengeId).select("+ghost");
    if (
      !row ||
      (row.toUserId !== account.id && row.fromUserId !== account.id)
    ) {
      throw new NotFoundException(
        "This challenge does not exist or has expired"
      );
    }
    return {
      ...toChallenge(row.toObject() as ILeanChallenge),
      ghost: Buffer.from(row.ghost).toString("base64"),
    };
  }
}
