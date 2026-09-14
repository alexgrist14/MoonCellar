import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import {
  getS3Bucket,
  getS3Endpoint,
  LEGACY_BUCKET_PREFIX,
  S3_FOLDERS,
  S3Folder,
} from "../src/shared/s3";

const HELP = `Copy every legacy regru bucket into its folder of the DigitalOcean Space.

Usage: bun scripts/transfer-s3.ts [options]

  --folders=covers,avatars  only these folders (default: all of them)
  --check                   compare source and destination instead of copying
  --dry-run                 list what would be copied without writing anything
  --no-fast-list            list per directory: slower, but does not hold every key in memory
  --log-dir=path            write one rclone log per folder into this directory
  --help                    print this text

Environment:
  LEGACY_S3_ID, LEGACY_S3_KEY   regru credentials, the source
  LEGACY_S3_ENDPOINT            source endpoint, default https://s3.regru.cloud
  S3_ID, S3_KEY                 DigitalOcean Spaces credentials, the destination
  S3_ENDPOINT, S3_BUCKET        destination endpoint and Space, default sfo3 / mooncellar
`;

const DEFAULT_LEGACY_ENDPOINT = "https://s3.regru.cloud";
const PRIVATE_FOLDERS: ReadonlySet<S3Folder> = new Set([S3_FOLDERS.common]);
const TUNING = ["--transfers", "32", "--checkers", "32", "--tpslimit", "250"];

const args = process.argv.slice(2);
const hasFlag = (name: string) => args.includes(`--${name}`);
const optionValue = (name: string) =>
  args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

if (hasFlag("help")) {
  console.log(HELP);
  process.exit(0);
}

const allFolders = Object.values(S3_FOLDERS);
const requested = optionValue("folders")
  ?.split(",")
  .map((folder) => folder.trim())
  .filter(Boolean);
const unknown = (requested ?? []).filter(
  (folder) => !(allFolders as string[]).includes(folder)
);

if (unknown.length) {
  fail(`Unknown folders: ${unknown.join(", ")}. Known: ${allFolders.join(", ")}`);
}

const folders = (requested ?? allFolders) as S3Folder[];

const missing = ["LEGACY_S3_ID", "LEGACY_S3_KEY", "S3_ID", "S3_KEY"].filter(
  (name) => !process.env[name]
);

if (missing.length) {
  fail(`Missing environment variables: ${missing.join(", ")}\n\n${HELP}`);
}

if (process.env.LEGACY_S3_ID === process.env.S3_ID) {
  fail(
    "LEGACY_S3_ID and S3_ID are the same key, so the Space would be written with the regru " +
      "credentials. Put the DigitalOcean keys in S3_ID and S3_KEY."
  );
}

const probe = spawnSync("rclone", ["version"], { encoding: "utf8" });

if (probe.error || probe.status !== 0) {
  fail("rclone is not installed or not on PATH: https://rclone.org/install/");
}

const mode = hasFlag("check") ? "check" : "copy";
const isDryRun = mode === "copy" && hasFlag("dry-run");
const bucket = getS3Bucket();
const logDir = optionValue("log-dir");

if (logDir) mkdirSync(logDir, { recursive: true });

const env = {
  ...process.env,
  RCLONE_CONFIG_MOONCELLAR_REGRU_TYPE: "s3",
  RCLONE_CONFIG_MOONCELLAR_REGRU_PROVIDER: "Other",
  RCLONE_CONFIG_MOONCELLAR_REGRU_ENDPOINT:
    process.env.LEGACY_S3_ENDPOINT || DEFAULT_LEGACY_ENDPOINT,
  RCLONE_CONFIG_MOONCELLAR_REGRU_ACCESS_KEY_ID: process.env.LEGACY_S3_ID,
  RCLONE_CONFIG_MOONCELLAR_REGRU_SECRET_ACCESS_KEY: process.env.LEGACY_S3_KEY,
  RCLONE_CONFIG_MOONCELLAR_SPACES_TYPE: "s3",
  RCLONE_CONFIG_MOONCELLAR_SPACES_PROVIDER: "DigitalOcean",
  RCLONE_CONFIG_MOONCELLAR_SPACES_ENDPOINT: getS3Endpoint().replace(/^https?:\/\//, ""),
  RCLONE_CONFIG_MOONCELLAR_SPACES_ACCESS_KEY_ID: process.env.S3_ID,
  RCLONE_CONFIG_MOONCELLAR_SPACES_SECRET_ACCESS_KEY: process.env.S3_KEY,
};

const failures: string[] = [];

for (const folder of folders) {
  const source = `mooncellar_regru:${LEGACY_BUCKET_PREFIX}${folder}`;
  const destination = `mooncellar_spaces:${bucket}/${folder}`;

  const shared = [
    source,
    destination,
    "--size-only",
    ...TUNING,
    ...(hasFlag("no-fast-list") ? [] : ["--fast-list"]),
    "--stats",
    "1m",
    "--stats-one-line",
    ...(logDir ? ["--log-file", `${logDir}/transfer-${folder}.log`] : []),
  ];

  const rcloneArgs =
    mode === "check"
      ? ["check", ...shared, "--one-way"]
      : [
          "copy",
          ...shared,
          "--s3-acl",
          PRIVATE_FOLDERS.has(folder) ? "private" : "public-read",
          "--s3-no-check-bucket",
          ...(isDryRun ? ["--dry-run"] : []),
        ];

  console.log(`\n== ${folder}: ${mode} ${source} -> ${destination}`);

  const result = spawnSync("rclone", rcloneArgs, { stdio: "inherit", env });

  if (result.status !== 0) {
    failures.push(`${folder} (exit ${result.status ?? result.signal})`);
  }
}

if (failures.length) {
  fail(`\nFailed: ${failures.join(", ")}`);
}

const verb = mode === "check" ? "Checked" : isDryRun ? "Dry-ran" : "Copied";
console.log(`\n${verb} ${folders.length} folder(s) into ${bucket}.`);
