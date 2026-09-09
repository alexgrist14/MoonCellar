import { chromium } from "playwright-core";

const BASE_URL = process.env.CHECK_BASE_URL || "http://localhost:3111";
const CHROME_PATH = process.env.CHROME_PATH;

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
];

const PAGES = [
  { path: "/gauntlet", mustFit: true },
  { path: "/", mustFit: false },
  { path: "/games", mustFit: false },
  { path: "/games/genre/shooter", mustFit: false },
];

const launchOptions = CHROME_PATH
  ? { executablePath: CHROME_PATH }
  : { channel: "chrome" };

const browser = await chromium.launch({
  ...launchOptions,
  args: ["--no-sandbox", "--disable-gpu"],
});

let failed = 0;

for (const viewport of VIEWPORTS) {
  console.log(`\n${viewport.width}x${viewport.height}`);

  for (const { path, mustFit } of PAGES) {
    const page = await browser.newPage({ viewport });

    try {
      await page.goto(BASE_URL + path, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForTimeout(1200);

      const result = await page.evaluate(() => {
        const container = document.querySelector("main.container");

        if (!container) return null;

        const styles = getComputedStyle(container);

        return {
          height: Math.round(container.getBoundingClientRect().height),
          viewportHeight: window.innerHeight,
          paddingTop: styles.paddingTop,
          paddingBottom: styles.paddingBottom,
        };
      });

      if (!result) {
        console.log(`  ${path} — no .container found`);
        continue;
      }

      const fits = result.height <= result.viewportHeight + 1;
      const status = mustFit ? (fits ? "ok" : "OVERFLOW") : "flows";

      if (mustFit && !fits) failed += 1;

      console.log(
        `  ${path.padEnd(24)} ${String(result.height).padStart(5)}px / ` +
          `${result.viewportHeight}px  ` +
          `padding ${result.paddingTop}/${result.paddingBottom}  ${status}`
      );
    } catch (error) {
      failed += 1;
      console.log(`  ${path.padEnd(24)} failed: ${error.message.split("\n")[0]}`);
    } finally {
      await page.close();
    }
  }
}

await browser.close();

if (failed) {
  console.log(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nall checks passed");
