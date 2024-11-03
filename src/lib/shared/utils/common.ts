import { IImageData } from "../types/common.type";

const getDate = (dateString: string, isWithTime?: boolean) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const time = `${date.getHours()}:${date.getMinutes()}`;

  return `${day > 9 ? day : `0${day}`}.${
    month > 9 ? month : `0${month}`
  }.${date.getFullYear()}${isWithTime ? " " + time : ""}`;
};

const upFL = (string: string) => {
  return string.slice(0, 1).toUpperCase() + string.slice(1).toLowerCase();
};

const getImageMeta = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject();
    img.src = url;
  });
};

const getImageData = async (url: string): Promise<IImageData> => {
  const imageMeta = await getImageMeta(url);
  const imageAR = imageMeta.width / imageMeta.height;
  const imageBlob = await fetch(url).then((r) => r.blob());
  const imageBuffer = await imageBlob.arrayBuffer();

  return { imageMeta, imageAR, imageBlob, imageBuffer };
};

export const shuffle = <T>(arr: T[]) => {
  let count = arr.length,
    temp: T,
    index: number;

  while (count > 0) {
    index = Math.floor(Math.random() * count);
    count--;

    temp = arr[count];
    arr[count] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const getWordEnding = (num: number, words: [string, string, string]) => {
  const cases = [2, 0, 1, 1, 1, 2];
  return words[
    num % 100 > 4 && num % 100 < 20 ? 2 : cases[num % 10 < 5 ? num % 10 : 5]
  ];
};

const getMaxLength = (array: Object[]): number => {
  return array.reduce<number>(
    (result, item) =>
      Object.values(item).length > result
        ? (result = Object.values(item).length)
        : result,
    0,
  );
};

const getMaxElement = (array: Object[]) => {
  return array.reduce(
    (result: Object, item) =>
      Object.values(item).length > Object.values(result).length
        ? (result = item)
        : result,
    {},
  );
};

const getAllKeys = (array: Object[]): string[] => {
  return array.reduce<string[]>((result, item) => {
    Object.keys(item).forEach(
      (key) => !result.some((item) => item === key) && result.push(key),
    );

    return result;
  }, []);
};

export const commonUtils = {
  getDate,
  upFL,
  getImageMeta,
  getImageData,
  shuffle,
  getWordEnding,
  getMaxLength,
  getMaxElement,
  getAllKeys,
};
