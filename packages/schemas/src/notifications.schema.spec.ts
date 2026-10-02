import { describe, expect, it } from "bun:test";
import { PushEndpointSchema, UpdateSettingsSchema } from "./index";
import { getActorsLabel } from "./notifications.utils";

const actors = (names: string[]) =>
  names.map((userName, index) => ({ _id: String(index), userName }));

describe("PushEndpointSchema", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://web.push.apple.com/QGuQ",
    "https://wns2-par02p.notify.windows.com/w/?token=abc",
  ])("accepts %s", (endpoint) => {
    expect(PushEndpointSchema.safeParse(endpoint).success).toBe(true);
  });

  it.each([
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://169.254.169.254/latest/meta-data",
    "https://localhost:3228/admin",
    "https://fcm.googleapis.com.evil.com/x",
    "https://evilnotify.windows.com/x",
    "not a url",
  ])("refuses %s", (endpoint) => {
    expect(PushEndpointSchema.safeParse(endpoint).success).toBe(false);
  });
});

describe("getActorsLabel", () => {
  it("names up to three people and counts the rest", () => {
    expect(getActorsLabel({ actors: actors(["Ann"]), actorsCount: 1 })).toBe(
      "Ann"
    );
    expect(
      getActorsLabel({ actors: actors(["Ann", "Bob"]), actorsCount: 2 })
    ).toBe("Ann and Bob");
    expect(
      getActorsLabel({ actors: actors(["Ann", "Bob", "Cid"]), actorsCount: 3 })
    ).toBe("Ann, Bob and Cid");
    expect(
      getActorsLabel({ actors: actors(["Ann", "Bob", "Cid"]), actorsCount: 4 })
    ).toBe("Ann, Bob and 2 others");
    expect(getActorsLabel({ actors: [], actorsCount: 0 })).toBeNull();
  });
});

describe("UpdateSettingsSchema", () => {
  it("adds no defaults to a partial update", () => {
    expect(UpdateSettingsSchema.parse({ showAdultContent: true })).toEqual({
      showAdultContent: true,
    });
  });
});
