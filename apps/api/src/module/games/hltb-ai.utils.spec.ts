import mongoose from "mongoose";
import { buildHltbAiInput } from "./utils/hltb-ai.utils";

const PLATFORM_ID = new mongoose.Types.ObjectId();
const GAME_A = new mongoose.Types.ObjectId();

describe("HLTB AI judge", () => {
  it("names each candidate's platforms and developers in the input", () => {
    const input = JSON.parse(
      buildHltbAiInput({
        entry: { id: 1, name: "Envoy", mainTime: 7200 },
        page: null,
        games: [
          {
            _id: GAME_A,
            name: "Envoy",
            platformIds: [PLATFORM_ID],
            first_release: 1_600_000_000,
            companies: [
              { name: "Dev", developer: true, publisher: false },
              { name: "Pub", developer: false, publisher: true },
            ],
          },
        ],
        platformNames: new Map([[String(PLATFORM_ID), "PC"]]),
      })
    );

    expect(input.hltbEntry.hours.main).toBe(2);
    expect(input.candidates[0]).toMatchObject({
      id: String(GAME_A),
      platforms: ["PC"],
      developers: ["Dev"],
      publishers: ["Pub"],
      released: "2020-09-13",
    });
  });
});
