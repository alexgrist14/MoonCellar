import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCHEMA_FILES = [
  "files.schema.ts",
  "game-followings-status.schema.ts",
  "game-stats.schema.ts",
  "games.schema.ts",
  "platforms.schema.ts",
  "playthroughs.schema.ts",
  "ra.schema.ts",
  "role.schema.ts",
  "user-logs.schema.ts",
  "user-ratings.schema.ts",
  "user.schema.ts",
  "utils.ts",
];

const serverDir = resolve(__dirname, "../src/shared/zod/schemas");
const clientRoot = resolve(
  process.env.MOONCELLAR_CLIENT_PATH || resolve(__dirname, "../../MoonCellar")
);
const clientDir = resolve(clientRoot, "src/lib/shared/lib/schemas");

if (!existsSync(clientDir)) {
  console.warn(`Client schemas not found at ${clientDir} — skipping parity check.`);
  process.exit(0);
}

const drifted = SCHEMA_FILES.filter((file) => {
  const serverPath = resolve(serverDir, file);
  const clientPath = resolve(clientDir, file);

  if (!existsSync(serverPath) || !existsSync(clientPath)) return true;

  return readFileSync(serverPath, "utf8") !== readFileSync(clientPath, "utf8");
});

if (drifted.length) {
  console.error("Zod schema drift detected in:");
  drifted.forEach((file) => console.error(`  - ${file}`));
  console.error("\nThe server copy is canonical. Sync the client copy byte-for-byte.");
  process.exit(1);
}

console.log(`All ${SCHEMA_FILES.length} zod schema files are identical.`);
