import {
  HLTB_CATALOG_PAGE_SIZE,
  HLTB_STRONG_TITLE_SIMILARITY,
  HLTB_SYNC_CRON,
  HLTB_SYNC_CRON_OPTIONS,
} from "./constants/hltb";

describe("HLTB cron configuration", () => {
  it("syncs weekly from catalogue pages HLTB still serves", () => {
    expect(HLTB_SYNC_CRON).toBe("0 5 * * 0");
    expect(HLTB_SYNC_CRON_OPTIONS).toEqual({
      name: "hltb-weekly-sync",
      timeZone: "Europe/Moscow",
    });
    expect(HLTB_CATALOG_PAGE_SIZE).toBe(25);
    expect(HLTB_STRONG_TITLE_SIMILARITY).toBe(0.85);
  });
});
