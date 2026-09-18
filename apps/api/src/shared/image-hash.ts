import { createHash } from "node:crypto";
import sharp from "sharp";

const DHASH_WIDTH = 17;
const DHASH_HEIGHT = 16;
const DHASH_HEX_LENGTH = ((DHASH_WIDTH - 1) * DHASH_HEIGHT) / 4;

export const DEFAULT_PERCEPTUAL_THRESHOLD = 10;
export const MAX_PERCEPTUAL_THRESHOLD = (DHASH_WIDTH - 1) * DHASH_HEIGHT;

export interface IImageFingerprint {
  md5: string;
  dHash: string;
  width: number;
  height: number;
  bytes: number;
}

export const getImageFingerprint = async (
  buffer: Buffer
): Promise<IImageFingerprint> => {
  const [metadata, { data }] = await Promise.all([
    sharp(buffer).metadata(),
    sharp(buffer)
      .greyscale()
      .resize(DHASH_WIDTH, DHASH_HEIGHT, { fit: "fill" })
      .raw()
      .toBuffer({ resolveWithObject: true }),
  ]);

  let hash = 0n;

  for (let y = 0; y < DHASH_HEIGHT; y++) {
    for (let x = 0; x < DHASH_WIDTH - 1; x++) {
      const index = y * DHASH_WIDTH + x;

      hash = (hash << 1n) | (data[index] < data[index + 1] ? 1n : 0n);
    }
  }

  return {
    md5: createHash("md5").update(buffer).digest("hex"),
    dHash: hash.toString(16).padStart(DHASH_HEX_LENGTH, "0"),
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    bytes: buffer.length,
  };
};

export const getHammingDistance = (left: string, right: string) => {
  let diff = BigInt(`0x${left}`) ^ BigInt(`0x${right}`);
  let distance = 0;

  while (diff) {
    distance += Number(diff & 1n);
    diff >>= 1n;
  }

  return distance;
};
