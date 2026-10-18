import { describe, expect, it } from "bun:test";
import type { IGameAchievementDefinition } from "../../games/achievements";
import {
  UNLOCK_MAX_AGE_DAYS,
  toAchievement,
  toPlayerAchievement,
  unlockTime,
} from "./achievement-view";

const plain: IGameAchievementDefinition = {
  key: "bag-20",
  icon: "bag-20.svg",
  title: { en: "Bag Hunter", ru: "Охотник за сумками" },
  description: { en: "Find 20 hidden bags.", ru: "Найдите 20 спрятанных сумок." },
  progress: { target: 20, unit: "count" },
  trigger: { index: 5 },
};
const secret: IGameAchievementDefinition = { ...plain, key: "secret", hidden: true };

describe("toAchievement", () => {
  it("gives the icon's path on the service", () => {
    expect(toAchievement("rooftops", plain, false).icon).toBe(
      "/games/rooftops/achievements/icons/bag-20.svg"
    );
  });

  it("hides the texts of a hidden achievement until it is unlocked", () => {
    expect(toAchievement("rooftops", secret, false).title).toBeNull();
    expect(toAchievement("rooftops", secret, true).title?.en).toBe("Bag Hunter");
  });

  it("does not give out the port's trigger", () => {
    expect("trigger" in toAchievement("rooftops", plain, false)).toBe(false);
  });
});

describe("toPlayerAchievement", () => {
  it("is locked without a state", () => {
    const view = toPlayerAchievement("rooftops", plain, undefined);
    expect(view.unlocked).toBe(false);
    expect(view.unlockedAt).toBeNull();
    expect(view.current).toBeNull();
  });

  it("takes the unlock time and the progress from the state", () => {
    const at = new Date("2026-10-18T12:00:00.000Z");
    const view = toPlayerAchievement("rooftops", plain, {
      key: "bag-20",
      unlockedAt: at,
      current: 20,
    });
    expect(view.unlocked).toBe(true);
    expect(view.unlockedAt).toBe(at.toISOString());
    expect(view.current).toBe(20);
  });
});

describe("unlockTime", () => {
  const now = new Date("2026-10-18T12:00:00.000Z");

  it("is now without the game's time", () => {
    expect(unlockTime(undefined, now)).toEqual(now);
  });

  it("keeps the game's time of a queued unlock", () => {
    expect(unlockTime("2026-10-10T08:30:00Z", now).toISOString()).toBe(
      "2026-10-10T08:30:00.000Z"
    );
  });

  it("does not take a time ahead of the server", () => {
    expect(unlockTime("2026-10-18T12:00:01Z", now)).toEqual(now);
  });

  it("does not take a time older than the limit", () => {
    const old = new Date(now.getTime() - (UNLOCK_MAX_AGE_DAYS + 1) * 86_400_000);
    expect(unlockTime(old.toISOString(), now)).toEqual(now);
  });
});
