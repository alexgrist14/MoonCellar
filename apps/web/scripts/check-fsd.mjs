import { readdirSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const LIB = "src/lib";
const LAYERS = ["shared", "entities", "features", "widgets", "pages", "app"];

const errors = [];

for (const file of readdirSync(LIB, { recursive: true })) {
  if (!/\.tsx?$/.test(file)) continue;

  const parts = file.split("/");
  const from = LAYERS.indexOf(parts[0]);

  if (parts[0] === "pages" && parts.length > 3) {
    errors.push(`${LIB}/${file}: a page folder holds only the page — move this into widgets/features/entities/shared`);
  }

  for (const [, spec] of readFileSync(`${LIB}/${file}`, "utf8").matchAll(/from\s+"([^"]+)"/g)) {
    const target = spec.startsWith("@/src/lib/")
      ? spec.slice("@/src/lib/".length)
      : spec.startsWith(".")
        ? relative(LIB, resolve(LIB, dirname(file), spec))
        : null;
    const to = target ? LAYERS.indexOf(target.split("/")[0]) : -1;

    if (to > from) {
      errors.push(`${LIB}/${file}: imports "${spec}" from ${LAYERS[to]} — imports only point down ${LAYERS.join(" < ")}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
