import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  IGameAccount,
  IGameAchievementList,
  IGameAchievementReport,
  IGamePlayerAchievement,
  IGamePlayerAchievements,
  IGamePlayerGameAchievements,
} from "@mooncellar/schemas";
import type { Model } from "mongoose";
import type { IGameDefinition } from "../../games/game-definition";
import { GAMES } from "../../games/games";
import {
  type IAchievementStateRow,
  toAchievement,
  toPlayerAchievement,
  unlockTime,
} from "./achievement-view";
import { AchievementState } from "./schemas/achievement-state.schema";

type IStateRow = IAchievementStateRow & { game: string };

const isDuplicate = (error: unknown) =>
  (error as { code?: number })?.code === 11000;

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel(AchievementState.name)
    private readonly states: Model<AchievementState>
  ) {}

  private achievementsOf(game: IGameDefinition) {
    if (!game.achievements) {
      throw new NotFoundException(`${game.name} has no achievements`);
    }
    return game.achievements;
  }

  catalog(game: IGameDefinition): IGameAchievementList {
    const { list } = this.achievementsOf(game);
    return {
      game: game.slug,
      total: list.length,
      achievements: list.map((achievement) =>
        toAchievement(game.slug, achievement, false)
      ),
    };
  }

  icon(game: IGameDefinition, file: string): string {
    const svg = this.achievementsOf(game).icons.get(file);
    if (!svg) {
      throw new NotFoundException(`${game.name} has no achievement icon "${file}"`);
    }
    return svg;
  }

  async player(
    game: IGameDefinition,
    userId: string
  ): Promise<IGamePlayerAchievements> {
    const { list } = this.achievementsOf(game);
    const rows = await this.states
      .find({ game: game.slug, userId })
      .lean<IStateRow[]>();
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const achievements = list.map((achievement) =>
      toPlayerAchievement(game.slug, achievement, byKey.get(achievement.key))
    );
    return {
      game: game.slug,
      userId,
      total: list.length,
      unlocked: achievements.filter((achievement) => achievement.unlocked).length,
      achievements,
    };
  }

  // The unlock is kept once with its first time; `current` only grows. Repeating a report is safe.
  async report(
    game: IGameDefinition,
    account: IGameAccount,
    key: string,
    report: IGameAchievementReport
  ): Promise<IGamePlayerAchievement> {
    const achievement = this.achievementsOf(game).list.find(
      (candidate) => candidate.key === key
    );
    if (!achievement) {
      throw new NotFoundException(`${game.name} has no achievement "${key}"`);
    }
    const filter = { game: game.slug, userId: account.id, key };
    const at = unlockTime(report.unlockedAt, new Date());
    const update: Record<string, unknown> = {
      $setOnInsert: { unlockedAt: report.unlocked ? at : null },
    };
    if (report.current !== undefined) update.$max = { current: report.current };
    try {
      await this.states.updateOne(filter, update, { upsert: true });
    } catch (error) {
      // Two reports of a new achievement at once: the other one inserted it
      if (!isDuplicate(error)) throw error;
      await this.states.updateOne(filter, update);
    }
    if (report.unlocked) {
      await this.states.updateOne(
        { ...filter, unlockedAt: null },
        { $set: { unlockedAt: at } }
      );
    }
    const state = await this.states.findOne(filter).lean<IStateRow>();
    return toPlayerAchievement(game.slug, achievement, state ?? undefined);
  }

  // Every game with achievements the player has touched, for the profile
  async summary(userId: string): Promise<IGamePlayerGameAchievements[]> {
    const rows = await this.states.find({ userId }).lean<IStateRow[]>();
    return GAMES.flatMap((game) => {
      if (!game.achievements) return [];
      const mine = rows.filter((row) => row.game === game.slug);
      if (!mine.length) return [];
      const keys = new Set(game.achievements.list.map((a) => a.key));
      const unlocked = mine
        .filter((row) => keys.has(row.key) && row.unlockedAt)
        .map((row) => row.unlockedAt!.getTime());
      return [
        {
          game: game.slug,
          name: game.name,
          total: keys.size,
          unlocked: unlocked.length,
          lastUnlockedAt: unlocked.length
            ? new Date(Math.max(...unlocked)).toISOString()
            : null,
        },
      ];
    });
  }
}
