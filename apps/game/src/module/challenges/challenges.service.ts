import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  IGameAccount,
  IGameChallenge,
  IGameChallengeCreate,
  IGameChallengeWithReplay,
} from "@mooncellar/schemas";
import type { Model } from "mongoose";
import type { IGameDefinition } from "../../games/game-definition";
import { AccountService } from "../account/account.service";
import { LeaderboardsService } from "../leaderboards/leaderboards.service";
import { Challenge } from "./schemas/challenge.schema";

const LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_UNDELIVERED_PER_PAIR = 5;

type ILeanChallenge = Challenge & { _id: { toString(): string } };

const toChallenge = (row: ILeanChallenge): IGameChallenge => ({
  id: row._id.toString(),
  game: row.game,
  board: row.board,
  fromUserId: row.fromUserId,
  fromName: row.fromName,
  toUserId: row.toUserId,
  score: row.score,
  comment: row.comment,
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class ChallengesService implements OnModuleInit {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    @InjectModel(Challenge.name)
    private readonly challenges: Model<Challenge>,
    private readonly accounts: AccountService,
    private readonly leaderboards: LeaderboardsService
  ) {}

  async onModuleInit() {
    const result = await this.challenges.collection.updateMany(
      { level: { $exists: true } },
      [
        {
          $set: {
            game: "rooftops",
            board: {
              $concat: ["level-", { $toString: { $add: ["$level", 1] } }],
            },
            score: "$timeMs",
            replay: "$ghost",
          },
        },
        { $unset: ["level", "timeMs", "ghost"] },
      ]
    );
    if (result.modifiedCount) {
      this.logger.log(
        `Moved ${result.modifiedCount} challenges to game boards`
      );
    }
    await this.challenges.syncIndexes();
  }

  async create(
    game: IGameDefinition,
    from: IGameAccount,
    dto: IGameChallengeCreate
  ): Promise<IGameChallenge> {
    const friends = await this.accounts.friendsOf(from.id);
    if (!friends.some((friend) => friend.id === dto.toUserId)) {
      throw new ForbiddenException(
        "You can challenge only people you follow or who follow you"
      );
    }
    const replay = dto.replay ? Buffer.from(dto.replay, "base64") : null;
    const rejection = await this.leaderboards.checkReplay(
      game,
      dto.board,
      dto.score,
      replay
    );
    if (rejection) {
      throw new UnprocessableEntityException(
        `${rejection}. The challenge was not sent`
      );
    }
    const waiting = await this.challenges.countDocuments({
      game: game.slug,
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
      game: game.slug,
      board: dto.board,
      fromUserId: from.id,
      fromName: from.userName,
      toUserId: dto.toUserId,
      score: dto.score,
      comment: dto.comment,
      replay,
      expiresAt: new Date(Date.now() + LIFETIME_MS),
    });
    return toChallenge(created.toObject() as ILeanChallenge);
  }

  async takeIncoming(
    game: IGameDefinition,
    account: IGameAccount
  ): Promise<IGameChallenge[]> {
    const rows = await this.challenges
      .find({ game: game.slug, toUserId: account.id, deliveredAt: null })
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
    game: IGameDefinition,
    account: IGameAccount,
    challengeId: string
  ): Promise<IGameChallengeWithReplay> {
    const row = await this.challenges
      .findOne({ _id: challengeId, game: game.slug })
      .select("+replay");
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
      replay: row.replay ? Buffer.from(row.replay).toString("base64") : null,
    };
  }
}
