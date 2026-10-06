import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import type { IRAAward } from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import {
  Platform,
  type PlatformDocument,
} from "../../games/schemas/platform.schema";
import {
  Playthrough,
  type IPlaythroughDocument,
} from "../../games/schemas/playthroughs.schema";
import { User } from "../../user/schemas/user.schema";
import { Rating } from "../../user/schemas/user-ratings.schema";

type TRaResult = { isMastered: boolean; date: string };

const MASTERY_AWARD = "Mastery/Completion";
const BEATEN_AWARD = "Game Beaten";

export const pickRaResults = (awards: IRAAward[]): Map<number, TRaResult> => {
  const results = new Map<number, TRaResult>();

  for (const award of awards ?? []) {
    if (award.awardType !== MASTERY_AWARD && award.awardType !== BEATEN_AWARD) {
      continue;
    }

    const isMastered = award.awardType === MASTERY_AWARD;
    const date = award.awardedAt.slice(0, 10);
    const current = results.get(award.awardData);

    if (
      !current ||
      (isMastered && !current.isMastered) ||
      (isMastered === current.isMastered && date < current.date)
    ) {
      results.set(award.awardData, { isMastered, date });
    }
  }

  return results;
};

type TSetGame = {
  _id: unknown;
  ratingsCount?: number;
  retroachievements?: { gameId: number }[];
};

export const pickGamesForSets = <T extends TSetGame>(
  games: T[],
  raIds: Iterable<number>,
  playedIds: Set<string>,
  ratedIds: Set<string>
): Map<number, T> => {
  const picked = new Map<number, T>();

  for (const raId of raIds) {
    const candidates = games.filter(({ retroachievements }) =>
      (retroachievements ?? []).some(({ gameId }) => gameId === raId)
    );
    const rank = (game: T) => [
      Number(playedIds.has(String(game._id))),
      Number(ratedIds.has(String(game._id))),
      game.ratingsCount ?? 0,
    ];
    const best = candidates.sort((a, b) => {
      const [ra, rb] = [rank(a), rank(b)];

      return rb[0] - ra[0] || rb[1] - ra[1] || rb[2] - ra[2];
    })[0];

    if (best) picked.set(raId, best);
  }

  return picked;
};

@Injectable()
export class RaPlaythroughsService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Game.name) private readonly games: Model<GameDocument>,
    @InjectModel(Platform.name)
    private readonly platforms: Model<PlatformDocument>,
    @InjectModel(Playthrough.name)
    private readonly playthroughs: Model<IPlaythroughDocument>,
    @InjectModel(Rating.name) private readonly ratings: Model<Rating>,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(RaPlaythroughsService.name);
  }

  async sync(userId: mongoose.Types.ObjectId | string) {
    const user = await this.users
      .findById(userId)
      .select("raAwards raIgnoredSets raVerifiedAt settings")
      .lean();

    if (!user?.raVerifiedAt || !user.settings?.raSyncPlaythroughs) {
      return { created: 0, upgraded: 0 };
    }

    const ignored = new Set(user.raIgnoredSets ?? []);
    const results = pickRaResults(user.raAwards ?? []);

    for (const raId of ignored) results.delete(raId);

    if (!results.size) return { created: 0, upgraded: 0 };

    const games = await this.games
      .find({ "retroachievements.gameId": { $in: [...results.keys()] } })
      .select("_id retroachievements platformIds ratingsCount")
      .lean();
    const consoleIds = [
      ...new Set(
        games.flatMap(({ retroachievements }) =>
          (retroachievements ?? []).map(({ consoleId }) => consoleId)
        )
      ),
    ];
    const platforms = await this.platforms
      .find({ raId: { $in: consoleIds } })
      .select("_id raId")
      .lean();
    const existing = await this.playthroughs
      .find({ userId: user._id, gameId: { $in: games.map(({ _id }) => _id) } })
      .select("_id gameId raGameId isMastered category")
      .lean();

    const now = new Date().toISOString();
    const toCreate: Partial<Playthrough>[] = [];
    const toUpgrade: mongoose.Types.ObjectId[] = [];

    const gameIds = games.map(({ _id }) => _id);
    const ratedIds = new Set(
      (
        await this.ratings
          .find({
            userId: { $in: [user._id, String(user._id)] },
            gameId: { $in: [...gameIds, ...gameIds.map(String)] },
          })
          .select("gameId")
          .lean()
      ).map(({ gameId }) => String(gameId))
    );
    const playedIds = new Set(existing.map(({ gameId }) => String(gameId)));
    const pickedBySet = pickGamesForSets(
      games,
      results.keys(),
      playedIds,
      ratedIds
    );
    const setsByGame = new Map<string, number[]>();

    for (const [raId, game] of pickedBySet) {
      const key = String(game._id);
      setsByGame.set(key, [...(setsByGame.get(key) ?? []), raId]);
    }

    for (const game of games) {
      const pickedSets = setsByGame.get(String(game._id));

      if (!pickedSets) continue;

      const gamePlays = existing.filter(
        (play) => String(play.gameId) === String(game._id)
      );

      if (gamePlays.some((play) => play.raGameId == null)) continue;

      const sets = (game.retroachievements ?? [])
        .filter(({ gameId }) => pickedSets.includes(gameId))
        .sort(
          (a, b) =>
            Number(results.get(b.gameId)!.isMastered) -
            Number(results.get(a.gameId)!.isMastered)
        );
      const best = sets[0];

      if (!best) continue;

      const result = results.get(best.gameId)!;
      const auto = gamePlays.find((play) => play.raGameId != null);

      if (auto) {
        if (
          result.isMastered &&
          !auto.isMastered &&
          auto.category === "completed"
        ) {
          toUpgrade.push(auto._id as unknown as mongoose.Types.ObjectId);
        }

        continue;
      }

      const gamePlatformIds = new Set(
        (game.platformIds ?? []).map((id) => String(id))
      );
      const platform =
        platforms.find(
          ({ _id, raId }) =>
            raId === best.consoleId && gamePlatformIds.has(String(_id))
        ) ?? platforms.find(({ raId }) => raId === best.consoleId);

      toCreate.push({
        userId: user._id as unknown as mongoose.Schema.Types.ObjectId,
        gameId: game._id as unknown as mongoose.Schema.Types.ObjectId,
        category: "completed",
        isMastered: result.isMastered,
        date: result.date,
        ...(platform && {
          platformId: platform._id as unknown as mongoose.Schema.Types.ObjectId,
        }),
        isPublic: false,
        raGameId: best.gameId,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (toCreate.length) await this.playthroughs.insertMany(toCreate);

    if (toUpgrade.length) {
      await this.playthroughs.updateMany(
        { _id: { $in: toUpgrade } },
        { $set: { isMastered: true, updatedAt: now } }
      );
    }

    if (toCreate.length || toUpgrade.length) {
      this.logger.info(
        `RA playthroughs for user ${String(user._id)}: created ${toCreate.length}, mastered ${toUpgrade.length}`
      );
    }

    return { created: toCreate.length, upgraded: toUpgrade.length };
  }
}
