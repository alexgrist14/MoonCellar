import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  GameAchievementCatalogFileSchema,
  type IGameAchievementCatalogFile,
} from "@mooncellar/schemas";

export type IGameAchievementDefinition =
  IGameAchievementCatalogFile["achievements"][number];

export type IGameAchievements = {
  list: IGameAchievementDefinition[];
  // Icon file name -> SVG text
  icons: Map<string, string>;
};

// The icon rules of the format: a 24×24 outline in currentColor, paths only, like the site's
// own icons. Checked when the catalog loads, so a broken icon stops the service from starting.
const ICON_ROOT =
  /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1\.8" stroke-linecap="round" stroke-linejoin="round">(<path d="[MmLlHhVvCcSsQqTtAaZz0-9eE., +-]+"\/>)+<\/svg>\s*$/;

/**
 * The achievements of a game: `<dir>/achievements.json` in the format of the ports (copied as is
 * from the port's `config/achievements/<game>.json`) and its icons in `<dir>/achievements/`.
 */
export const loadAchievements = (
  dir: string,
  slug: string
): IGameAchievements => {
  const file = join(dir, "achievements.json");
  const catalog = GameAchievementCatalogFileSchema.parse(
    JSON.parse(readFileSync(file, "utf8"))
  );
  const problem = (message: string) => new Error(`${file}: ${message}`);
  if (catalog.game !== slug) {
    throw problem(`the catalog is of "${catalog.game}", not "${slug}"`);
  }
  const keys = new Set<string>();
  const languages = Object.keys(catalog.achievements[0].title).sort().join();
  const iconDir = join(dir, "achievements");
  const icons = new Map<string, string>();
  for (const achievement of catalog.achievements) {
    if (keys.has(achievement.key)) {
      throw problem(`the key "${achievement.key}" is used twice`);
    }
    keys.add(achievement.key);
    for (const texts of [achievement.title, achievement.description]) {
      if (Object.keys(texts).sort().join() !== languages) {
        throw problem(
          `"${achievement.key}" has other languages than the first achievement`
        );
      }
    }
    if (!icons.has(achievement.icon)) {
      const svg = readFileSync(join(iconDir, achievement.icon), "utf8");
      if (!ICON_ROOT.test(svg)) {
        throw problem(
          `the icon ${achievement.icon} is not a 24×24 currentColor outline of paths`
        );
      }
      icons.set(achievement.icon, svg);
    }
  }
  const unused = readdirSync(iconDir).filter(
    (name) => name.endsWith(".svg") && !icons.has(name)
  );
  if (unused.length) {
    throw problem(`icons no achievement uses: ${unused.join(", ")}`);
  }
  return { list: catalog.achievements, icons };
};
