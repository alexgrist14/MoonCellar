import { replaceRomanNumerals } from "./utils";

describe("replaceRomanNumerals", () => {
  it("replaces standalone roman numerals with arabic ones", () => {
    expect(replaceRomanNumerals("warcraft iii reign of chaos")).toBe(
      "warcraft 3 reign of chaos"
    );
    expect(replaceRomanNumerals("final fantasy xiv")).toBe("final fantasy 14");
    expect(replaceRomanNumerals("grand theft auto v")).toBe(
      "grand theft auto 5"
    );
    expect(replaceRomanNumerals("rome mcmxcix")).toBe("rome 1999");
  });

  it("leaves words and invalid numerals untouched", () => {
    expect(replaceRomanNumerals("diablo")).toBe("diablo");
    expect(replaceRomanNumerals("iiii vx")).toBe("iiii vx");
    expect(replaceRomanNumerals("warcraft 3")).toBe("warcraft 3");
  });
});
