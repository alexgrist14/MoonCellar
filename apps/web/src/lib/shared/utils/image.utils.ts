const IMAGE_LOAD_TIMEOUT = 8000;

export const createImage = (src: string, timeout = IMAGE_LOAD_TIMEOUT) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement("img");

    if (!src) return resolve(img);

    const timeoutId = setTimeout(
      () => reject(new Error(`Image load timed out: ${src}`)),
      timeout
    );

    img.src = src;
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    img.onerror = (event) => {
      clearTimeout(timeoutId);
      reject(event);
    };
  });
};

export const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number
) => {
  const naturalWidth = img.naturalWidth || dWidth;
  const naturalHeight = img.naturalHeight || dHeight;

  const scale = Math.max(dWidth / naturalWidth, dHeight / naturalHeight);
  const sWidth = dWidth / scale;
  const sHeight = dHeight / scale;
  const sx = (naturalWidth - sWidth) / 2;
  const sy = (naturalHeight - sHeight) / 2;

  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
};

export const compressDataUrl = async (
  dataUrl: string,
  maxSide = 1536,
  quality = 0.85
) => {
  const image = await createImage(dataUrl).catch(() => null);

  if (!image?.width) return dataUrl;

  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

  const compressed = canvas.toDataURL("image/webp", quality);

  return compressed.startsWith("data:image/webp") &&
    compressed.length < dataUrl.length
    ? compressed
    : dataUrl;
};

const KEY_COLORS = ["#00ff00", "#ff00ff", "#00ffff", "#0000ff"];
const KEY_SAMPLE_SIZE = 64;
const KEY_TRANSPARENT_DISTANCE = 70;
const KEY_OPAQUE_DISTANCE = 150;

const hexToRgb = (hex: string) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

const colorDistance = (data: Uint8ClampedArray, index: number, key: number[]) =>
  Math.hypot(
    data[index] - key[0],
    data[index + 1] - key[1],
    data[index + 2] - key[2]
  );

const readPixels = async (dataUrl: string, maxSide?: number) => {
  const image = await createImage(dataUrl).catch(() => null);
  const context = document.createElement("canvas").getContext("2d");

  if (!image?.width || !context) return null;

  const scale = maxSide
    ? Math.min(1, maxSide / Math.max(image.width, image.height))
    : 1;
  const { canvas } = context;

  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return {
    context,
    pixels: context.getImageData(0, 0, canvas.width, canvas.height),
  };
};

export const pickKeyColor = async (dataUrl: string) => {
  const sample = await readPixels(dataUrl, KEY_SAMPLE_SIZE);

  if (!sample) return KEY_COLORS[0];

  const { data } = sample.pixels;
  const clashes = KEY_COLORS.map((hex) => {
    const key = hexToRgb(hex);
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] && colorDistance(data, i, key) < KEY_OPAQUE_DISTANCE) {
        count++;
      }
    }

    return count;
  });

  return KEY_COLORS[clashes.indexOf(Math.min(...clashes))];
};

export const removeKeyColor = async (dataUrl: string, keyColor: string) => {
  const result = await readPixels(dataUrl);

  if (!result) return dataUrl;

  const { context, pixels } = result;
  const { data } = pixels;
  const key = hexToRgb(keyColor);

  for (let i = 0; i < data.length; i += 4) {
    const distance = colorDistance(data, i, key);

    if (distance >= KEY_OPAQUE_DISTANCE) continue;

    if (distance <= KEY_TRANSPARENT_DISTANCE) {
      data[i + 3] = 0;
      continue;
    }

    const share =
      (distance - KEY_TRANSPARENT_DISTANCE) /
      (KEY_OPAQUE_DISTANCE - KEY_TRANSPARENT_DISTANCE);

    for (let channel = 0; channel < 3; channel++) {
      const unmixed = (data[i + channel] - (1 - share) * key[channel]) / share;

      data[i + channel] = Math.max(0, Math.min(255, Math.round(unmixed)));
    }

    data[i + 3] = Math.round(data[i + 3] * share);
  }

  context.putImageData(pixels, 0, 0);

  return context.canvas.toDataURL("image/png");
};
