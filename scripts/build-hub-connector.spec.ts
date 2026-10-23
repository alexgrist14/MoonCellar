import { describe, expect, it } from "bun:test";
import { inflateRawSync } from "node:zlib";
import { connectorFiles, zip } from "./build-hub-connector";

const unzip = (archive: Buffer) => {
  const end = archive.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = archive.readUInt16LE(end + 10);
  let at = archive.readUInt32LE(end + 16);
  const files = new Map<string, Buffer>();
  for (let index = 0; index < count; index++) {
    const packedSize = archive.readUInt32LE(at + 20);
    const nameLength = archive.readUInt16LE(at + 28);
    const offset = archive.readUInt32LE(at + 42);
    const name = archive.toString("utf8", at + 46, at + 46 + nameLength);
    const start = offset + 30 + archive.readUInt16LE(offset + 26);
    files.set(
      name,
      inflateRawSync(archive.subarray(start, start + packedSize))
    );
    at += 46 + nameLength;
  }
  return files;
};

describe("hub connector", () => {
  it("packs the commands, scripts and templates under .claude", async () => {
    const files = await connectorFiles();
    const unpacked = unzip(zip(files));
    expect([...unpacked.keys()].sort()).toEqual(
      files.map((file) => file.path).sort()
    );
    for (const file of files)
      expect(unpacked.get(file.path)?.equals(file.data)).toBe(true);
    expect(unpacked.has(".claude/commands/hub-init.md")).toBe(true);
    expect(unpacked.has(".claude/hub/templates/task.md")).toBe(true);
  });

  it("bundles scripts that Node runs", async () => {
    const files = await connectorFiles();
    for (const path of [
      ".claude/hub/tasks.mjs",
      ".claude/hub/hub-connect.mjs",
    ]) {
      const code = files.find((file) => file.path === path)?.data.toString();
      expect(code).toBeDefined();
      expect(code).not.toContain("Bun.");
      expect(code).not.toContain("import.meta.main");
      expect(code).not.toContain("@mooncellar/");
    }
  });
});
