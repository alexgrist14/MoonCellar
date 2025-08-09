import { IUser } from "../types/auth.type";

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
      "second"
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

const upFL = (string: string) => {
  return !!string?.length
    ? string.slice(0, 1).toUpperCase() + string.slice(1).toLowerCase()
    : "";
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

const checkWindow = <T>(callback: () => T): T | undefined => {
  if (typeof window !== "undefined") {
    return callback();
  } else {
    return undefined;
  }
};

const addLeadingZero = (num: number) => {
  return num <= 9 ? "0" + num.toString() : num.toString();
};

const addLastS = (string: string, num: number) => {
  return num > 1 ? string + "s" : string;
};

const getUTCString = (offset: number) => {
  return `UTC${offset <= 0 ? "+" : ""}${-Math.round(offset / 60)}`;
};

const getTimezoneOffset = (timeZone?: string) => {
  if (!timeZone) return null;

  const dateTimezone = new Date(
    new Date().toLocaleString(navigator.language, {
      timeZone,
    })
  );
  const dateUTC = new Date(
    new Date().toLocaleString(navigator.language, {
      timeZone: "UTC",
    })
  );

  return (dateUTC.getTime() - dateTimezone.getTime()) / 1000 / 60;
};

const formatDate = (
  date: string | Date,
  options?: {
    delimiter?: string;
    isWithTime?: boolean;
    isWithUTC?: boolean;
    isISO?: boolean;
    isUTC?: boolean;
    timeZone?: string;
  }
) => {
  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (options?.isISO && !options.isUTC) {
    return (
      parsedDate.getFullYear() +
      (options?.delimiter || "-") +
      addLeadingZero(parsedDate.getMonth() + 1) +
      (options?.delimiter || "-") +
      addLeadingZero(parsedDate.getDate()) +
      (options?.isWithTime
        ? `T${addLeadingZero(parsedDate.getHours())}:${addLeadingZero(parsedDate.getMinutes())}:${addLeadingZero(parsedDate.getSeconds())}Z`
        : "")
    );
  }

  if (options?.isISO && options?.isUTC) {
    return (
      parsedDate.getUTCFullYear() +
      (options?.delimiter || "-") +
      addLeadingZero(parsedDate.getUTCMonth() + 1) +
      (options?.delimiter || "-") +
      addLeadingZero(parsedDate.getUTCDate()) +
      (options?.isWithTime
        ? `T${addLeadingZero(parsedDate.getUTCHours())}:${addLeadingZero(parsedDate.getUTCMinutes())}:${addLeadingZero(parsedDate.getUTCSeconds())}Z`
        : "")
    );
  }

  return (
    addLeadingZero(parsedDate.getDate()) +
    (options?.delimiter || ".") +
    addLeadingZero(parsedDate.getMonth() + 1) +
    (options?.delimiter || ".") +
    parsedDate.getFullYear() +
    (options?.isWithTime
      ? ` ${addLeadingZero(parsedDate.getHours())}:${addLeadingZero(parsedDate.getMinutes())}`
      : "") +
    (options?.isWithUTC
      ? ` (${getUTCString(getTimezoneOffset(options?.timeZone) || parsedDate.getTimezoneOffset())})`
      : "")
  );
};

export const commonUtils = {
  upFL,
  shuffle,
  getWordEnding,
  getAvatar,
  checkWindow,
  addLeadingZero,
  addLastS,
  formatDate,
  getUTCString,
  getHumanDate,
  getRoundedSeconds,
};
