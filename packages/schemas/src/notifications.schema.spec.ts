import { describe, expect, it } from "bun:test";
import {
  type INotification,
  PushEndpointSchema,
  UpdateSettingsSchema,
} from "./index";
import {
  getActorsLabel,
  getNotificationHref,
  getNotificationSentence,
} from "./notifications.utils";

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

describe("following-activity", () => {
  const notification = {
    _id: "n1",
    type: "following-activity",
    actors: [{ _id: "u1", userName: "anna" }],
    actorsCount: 1,
    payload: { gameSlug: "portal-2", gameName: "Portal 2" },
    isRead: false,
    createdAt: "2026-10-04T00:00:00.000Z",
    updatedAt: "2026-10-04T00:00:00.000Z",
  } as INotification;

  const sentence = (payload: Partial<INotification["payload"]>) =>
    getNotificationSentence({
      ...notification,
      payload: { ...notification.payload, ...payload },
    });

  it("says what the person did, and links to their profile", () => {
    expect(sentence({ activity: "rated", rating: 8 })).toBe(
      "anna rated Portal 2 8/10"
    );
    expect(sentence({ activity: "favorited" })).toBe(
      "anna added Portal 2 to favourites"
    );
    expect(sentence({ activity: "status", category: "completed" })).toBe(
      "anna completed Portal 2"
    );
    expect(sentence({ activity: "status", category: "wishlist" })).toBe(
      "anna added Portal 2 to their wishlist"
    );
    expect(sentence({ activity: "mastered" })).toBe("anna mastered Portal 2");
    expect(sentence({ activity: "updated" })).toBe(
      "anna updated their playthrough of Portal 2"
    );
    expect(sentence({})).toBe("anna added to their activity: Portal 2");
    expect(getNotificationHref(notification)).toBe("/user/anna");
  });
});
