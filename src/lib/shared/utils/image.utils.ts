export const createImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement("img");

    if (!src) return resolve(img);

    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
};
