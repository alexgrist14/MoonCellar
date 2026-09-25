import { readTarEntry } from "./tar.utils";

const tarEntry = (name: string, content: string) => {
  const header = Buffer.alloc(512);
  const data = Buffer.from(content);

  header.write(name, 0);
  header.write(`${data.length.toString(8).padStart(11, "0")}\0`, 124);

  return Buffer.concat([
    header,
    data,
    Buffer.alloc((512 - (data.length % 512)) % 512),
  ]);
};

async function* chunked(buffer: Buffer, size: number) {
  for (let i = 0; i < buffer.length; i += size) {
    yield buffer.subarray(i, i + size);
  }
}

describe("readTarEntry", () => {
  const aliases = "c36\t0\tRedman\t\\N\nc36\t2\tエミヤ\tEmiya\n";
  const archive = Buffer.concat([
    tarEntry("db/chars", "x".repeat(1500)),
    tarEntry("db/chars_alias", aliases),
    tarEntry("db/chars_names", "y".repeat(10)),
    Buffer.alloc(1024),
  ]);

  it.each([1, 7, 512, 4096])(
    "returns the entry content when read in %i-byte chunks",
    async (size) => {
      const entry = await readTarEntry(
        chunked(archive, size),
        "db/chars_alias"
      );

      expect(entry?.toString()).toBe(aliases);
    }
  );

  it("returns null when the entry is missing", async () => {
    expect(await readTarEntry(chunked(archive, 100), "db/missing")).toBeNull();
  });
});
