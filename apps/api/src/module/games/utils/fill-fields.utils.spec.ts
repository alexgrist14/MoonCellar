import { pickEmptyFields } from "./fill-fields.utils";

describe("pickEmptyFields", () => {
  it("keeps only values for fields the game does not have yet", () => {
    expect(
      pickEmptyFields(
        {
          cover: null,
          summary: "Already written",
          genres: [],
          first_release: 0,
          companies: undefined,
        },
        {
          cover: "https://cdn/cover.jpg",
          summary: "From Steam",
          genres: ["Indie"],
          first_release: 1472083200,
          companies: [],
        }
      )
    ).toEqual({ cover: "https://cdn/cover.jpg", genres: ["Indie"] });
  });
});
