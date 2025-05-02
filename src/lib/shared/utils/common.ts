import { IUser } from "../types/auth";
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

const getHumanDate = (inputDate: Date | string) => {
  const currentDate = new Date();
  const targetDate = new Date(inputDate);

  const differenceInMs = targetDate.getTime() - currentDate.getTime();

  const differenceInSeconds = Math.round(differenceInMs / 1000);
  const differenceInMinutes = Math.round(differenceInMs / (1000 * 60));
  const differenceInHours = Math.round(differenceInMs / (1000 * 60 * 60));
  const differenceInDays = Math.round(differenceInMs / (1000 * 60 * 60 * 24));
  const differenceInMonths = Math.round(differenceInDays / 30);
  const differenceInYears = Math.round(differenceInMonths / 12);

  const relativeTime = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  if (Math.abs(differenceInSeconds) < 60) {
    return relativeTime.format(
      getRoundedSeconds(differenceInSeconds),
      "second",
    );
  } else if (Math.abs(differenceInMinutes) < 60) {
    return relativeTime.format(differenceInMinutes, "minute");
  } else if (Math.abs(differenceInHours) < 24) {
    return relativeTime.format(differenceInHours, "hour");
  } else if (Math.abs(differenceInDays) < 30) {
    return relativeTime.format(differenceInDays, "day");
  } else if (Math.abs(differenceInMonths) < 12) {
    return relativeTime.format(differenceInMonths, "month");
  } else {
    return relativeTime.format(differenceInYears, "year");
  }
};

const getRoundedSeconds = (value: number) => {
  const seconds = Math.abs(value);

  if (seconds < 10) {
    return -1;
  } else if (seconds < 20) {
    return -10;
  } else if (seconds < 30) {
    return -20;
  } else if (seconds < 40) {
    return -30;
  } else if (seconds < 50) {
    return -40;
  } else {
    return -50;
  }
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

const getAvatar = (user: IUser) => {
  return user.profilePicture
    ? `https://api.mooncellar.space/photos/${user.profilePicture}`
    : "";
};

export const shuffle = <T>(arr: T[]) => {
  const tempArr = structuredClone(arr);

  let count = tempArr.length,
    temp: T,
    index: number;

  while (count > 0) {
    index = Math.floor(Math.random() * count);
    count--;

    temp = tempArr[count];
    tempArr[count] = tempArr[index];
    tempArr[index] = temp;
  }

  return tempArr;
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

const checkWindow = <T>(callback: () => T): T | undefined => {
  if (typeof window !== "undefined") {
    return callback();
  } else {
    return undefined;
  }
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
  getHumanDate,
  getAvatar,
  checkWindow,
};
