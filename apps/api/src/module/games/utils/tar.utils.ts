const TAR_BLOCK_SIZE = 512;

export const readTarEntry = async (
  tar: AsyncIterable<Buffer>,
  entryName: string
): Promise<Buffer | null> => {
  let buffer: Buffer = Buffer.alloc(0);
  let entry: { name: string; size: number; remaining: number } | null = null;
  const parts: Buffer[] = [];

  for await (const chunk of tar) {
    buffer = buffer.length ? Buffer.concat([buffer, chunk]) : chunk;

    while (true) {
      if (!entry) {
        if (buffer.length < TAR_BLOCK_SIZE) break;

        const name = buffer.toString("utf8", 0, 100).replace(/\0[\s\S]*$/, "");

        if (!name) return null;

        const size = parseInt(buffer.toString("ascii", 124, 136), 8) || 0;

        entry = {
          name,
          size,
          remaining: Math.ceil(size / TAR_BLOCK_SIZE) * TAR_BLOCK_SIZE,
        };
        buffer = buffer.subarray(TAR_BLOCK_SIZE);
      }

      const taken = buffer.subarray(0, entry.remaining);

      if (entry.name === entryName) parts.push(taken);

      entry.remaining -= taken.length;
      buffer = buffer.subarray(taken.length);

      if (entry.remaining) break;
      if (entry.name === entryName) {
        return Buffer.concat(parts).subarray(0, entry.size);
      }

      entry = null;
    }
  }

  return null;
};
