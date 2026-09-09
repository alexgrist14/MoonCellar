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
