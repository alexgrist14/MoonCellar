import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { crc32, deflateRawSync } from "node:zlib";

const ROOT = join(import.meta.dir, "..");
const SOURCE = join(ROOT, "scripts", "hub-connector");
export const CONNECTOR_ZIP = join(
  ROOT,
  "apps",
  "web",
  "public",
  "hub-connector.zip"
);

interface IZipFile {
  path: string;
  data: Buffer;
}

const bundle = async (entry: string) => {
  const result = await Bun.build({
    entrypoints: [join(SOURCE, entry)],
    target: "node",
    format: "esm",
  });
  if (!result.success)
    throw new AggregateError(result.logs, `Could not bundle ${entry}`);
  return Buffer.from(await result.outputs[0].text());
};

const source = (path: string) => readFileSync(join(SOURCE, path));

export const connectorFiles = async (): Promise<IZipFile[]> => {
  const files: IZipFile[] = [
    { path: ".claude/commands/hub-init.md", data: source("hub-init.md") },
    { path: ".claude/hub/README.md", data: source("README.md") },
    {
      path: ".claude/hub/hub-connect.mjs",
      data: await bundle("hub-connect.ts"),
    },
    { path: ".claude/hub/tasks.mjs", data: await bundle("tasks.ts") },
    ...["hub.md", "task.md", "plan-section.md"].map((name) => ({
      path: `.claude/hub/templates/${name}`,
      data: source(join("templates", name)),
    })),
  ];
  const hash = createHash("sha256");
  for (const file of files) hash.update(file.path).update(file.data);
  return [
    ...files,
    {
      path: ".claude/hub/version",
      data: Buffer.from(`${hash.digest("hex").slice(0, 12)}\n`),
    },
  ];
};

const dosTime = (date: Date) => ({
  time:
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    (date.getSeconds() >> 1),
  day:
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate(),
});

export const zip = (files: IZipFile[], date = new Date()) => {
  const { time, day } = dosTime(date);
  const parts: Buffer[] = [];
  const entries: Buffer[] = [];
  let offset = 0;
  for (const { path, data } of files) {
    const name = Buffer.from(path);
    const packed = deflateRawSync(data);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, packed);

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(0x0314, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(time, 12);
    entry.writeUInt16LE(day, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(name.length, 28);
    entry.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    entry.writeUInt32LE(offset, 42);
    entries.push(entry, name);
    offset += local.length + name.length + packed.length;
  }
  const directory = Buffer.concat(entries);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
};

if (import.meta.main) {
  const files = await connectorFiles();
  mkdirSync(dirname(CONNECTOR_ZIP), { recursive: true });
  writeFileSync(CONNECTOR_ZIP, zip(files));
  console.log(
    `Hub connector: ${files.length} files in ${CONNECTOR_ZIP.slice(ROOT.length + 1)}`
  );
}
