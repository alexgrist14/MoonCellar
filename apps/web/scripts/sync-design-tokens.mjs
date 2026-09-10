import { readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptDir, "..");
const repoRoot = resolve(webRoot, "../..");

const stylesDir = join(webRoot, "src/lib/app/styles");
const rootScss = join(stylesDir, "root.scss");
const tokensCss = join(repoRoot, "docs/design-tokens.css");
const mockupsDir = join(repoRoot, "docs/mockups");

const START = "/* mooncellar-tokens:start */";
const END = "/* mooncellar-tokens:end */";

const isCheck = process.argv.includes("--check");

const readRootBlock = (source) => {
  const at = source.indexOf(":root");

  if (at === -1) return null;

  const open = source.indexOf("{", at);

  if (open === -1) return null;

  let depth = 0;

  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;

    if (source[i] === "}") {
      depth -= 1;

      if (depth === 0) return source.slice(open + 1, i);
    }
  }

  return null;
};

const collectSources = async () => {
  const root = await readFile(rootScss, "utf8");
  const names = [...root.matchAll(/@forward\s+"\.\/vars\/([\w-]+)"/g)].map(
    ([, name]) => name
  );

  if (!names.length) {
    throw new Error(`No "./vars/*" forwards found in ${rootScss}`);
  }

  return names.map((name) => ({
    name,
    path: join(stylesDir, "vars", `_${name}.scss`),
  }));
};

const buildTokens = async () => {
  const sources = await collectSources();
  const groups = [];

  for (const { name, path } of sources) {
    const block = readRootBlock(await readFile(path, "utf8"));

    if (block === null) {
      throw new Error(`No :root block in ${path}`);
    }

    const body = block
      .split("\n")
      .map((line) => line.replace(/\s+$/, ""))
      .filter((line) => line.trim().length)
      .join("\n");

    groups.push(`  /* vars/_${name}.scss */\n${body}`);
  }

  return `:root {\n${groups.join("\n\n")}\n}\n`;
};

const wrap = (tokens) =>
  [
    START,
    "/* Generated from apps/web/src/lib/app/styles/vars by",
    "   `bun --filter web sync:tokens`. Do not edit by hand. */",
    tokens.trimEnd(),
    END,
  ].join("\n");

const listMockups = async () => {
  try {
    const entries = await readdir(mockupsDir);

    return entries
      .filter((entry) => entry.endsWith(".html"))
      .map((entry) => join(mockupsDir, entry));
  } catch {
    return [];
  }
};

const injectInto = async (path, block) => {
  const source = await readFile(path, "utf8");
  const start = source.indexOf(START);
  const end = source.indexOf(END);

  if (start === -1 || end === -1) {
    return { path, status: "no-markers" };
  }

  const next =
    source.slice(0, start) + block + source.slice(end + END.length);

  if (next === source) return { path, status: "current" };

  if (!isCheck) await writeFile(path, next);

  return { path, status: "stale" };
};

const run = async () => {
  const tokens = await buildTokens();
  const block = wrap(tokens);
  const results = [];

  const existing = await readFile(tokensCss, "utf8").catch(() => null);
  const cssPayload = `${block}\n`;

  if (existing !== cssPayload) {
    if (!isCheck) await writeFile(tokensCss, cssPayload);
    results.push({ path: tokensCss, status: "stale" });
  } else {
    results.push({ path: tokensCss, status: "current" });
  }

  for (const path of await listMockups()) {
    results.push(await injectInto(path, block));
  }

  const relative = (path) => path.replace(`${repoRoot}/`, "");
  const stale = results.filter(({ status }) => status === "stale");
  const orphans = results.filter(({ status }) => status === "no-markers");

  for (const { path, status } of results) {
    console.log(`  ${status.padEnd(10)} ${relative(path)}`);
  }

  for (const { path } of orphans) {
    console.log(`\nMissing ${START} … ${END} in ${relative(path)}`);
  }

  if (isCheck && stale.length) {
    console.log(
      `\n${stale.length} file(s) out of date. Run: bun --filter web sync:tokens`
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    isCheck
      ? "\nDesign tokens are in sync."
      : `\nSynced ${results.length} file(s) from ${relative(stylesDir)}/vars.`
  );
};

await run();
