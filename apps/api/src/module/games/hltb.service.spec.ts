import {
  HLTB_CRON_DELAY_MS,
  HLTB_CRON_MAX_GAMES,
  HLTB_DEFAULT_BATCH_SIZE,
  HLTB_DEFAULT_DELAY_MS,
  HLTB_STALE_DAYS,
  HLTB_STRONG_TITLE_SIMILARITY,
  HLTB_SYNC_CRON,
  HLTB_SYNC_CRON_OPTIONS,
} from "./constants/hltb";

describe("HLTB cron configuration", () => {
  it("uses a weekly low-load schedule for HLTB sync", () => {
    expect(HLTB_SYNC_CRON).toBe("0 5 * * 0");
    expect(HLTB_SYNC_CRON_OPTIONS).toEqual({
      name: "hltb-weekly-sync",
      timeZone: "Europe/Moscow",
    });
    expect(HLTB_DEFAULT_BATCH_SIZE).toBe(50);
    expect(HLTB_DEFAULT_DELAY_MS).toBe(1500);
    expect(HLTB_CRON_MAX_GAMES).toBe(30000);
    expect(HLTB_CRON_DELAY_MS).toBe(3000);
    expect(HLTB_STALE_DAYS).toBe(30);
    expect(HLTB_STRONG_TITLE_SIMILARITY).toBe(0.85);
  });
});
