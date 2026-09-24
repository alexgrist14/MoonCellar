import type { Types } from "mongoose";
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getRandomArray = (array: unknown[], count: number) => {
  const randomIndices = [];

  if (!array.length) return [];
  if (array.length <= count) return array;

  while (randomIndices.length !== count) {
    const randomIndex = getRandomInt(0, array.length - 1);

    !randomIndices.includes(randomIndex) && randomIndices.push(randomIndex);
  }

  return randomIndices.map((index) => array[index]);
};

export const normalizeGameName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['\u2019]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const ROMAN_NUMERAL_PATTERN =
  /^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/;

const ROMAN_DIGITS: Record<string, number> = {
  i: 1,
  v: 5,
  x: 10,
  l: 50,
  c: 100,
  d: 500,
  m: 1000,
};

const romanToNumber = (token: string) =>
  [...token].reduce((total, char, index) => {
    const value = ROMAN_DIGITS[char];
    const next = ROMAN_DIGITS[token[index + 1]] ?? 0;

    return total + (value < next ? -value : value);
  }, 0);

export const replaceRomanNumerals = (normalizedName: string) =>
  normalizedName
    .split(" ")
    .map((token) =>
      token && ROMAN_NUMERAL_PATTERN.test(token)
        ? String(romanToNumber(token))
        : token
    )
    .join(" ");

export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";

export const uniqueSlug = async (
  isTaken: (slug: string) => Promise<unknown>,
  value: string
) => {
  const base = toSlug(value);

  for (let suffix = 1; ; suffix++) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;

    if (!(await isTaken(slug))) return slug;
  }
};

export const getFormattedTitle = (title: string) => {
  return title
    .replaceAll("The ", "")
    .replaceAll("The,", "")
    .replaceAll("Disney's", "")
    .replaceAll("Dreamworks'", "")
    .replaceAll("DreamWorks", "")
    .replaceAll("Dreamworks", "")
    .replaceAll("Zero", "0")
    .replaceAll(" and ", "")
    .replaceAll("James Bond", "")
    .replaceAll("~Hack~", "")
    .replaceAll("~Demo~", "")
    .replaceAll("~Homebrew~", "")
    .replaceAll("~Prototype~", "")
    .replaceAll("~Z~", "")
    .replaceAll("~Unlicensed~", "")
    .replace(/[^a-zA-Z0-9|]/g, "")
    .toLowerCase();
};

export const followListLookup = (field: "followings" | "followers") => [
  {
    $lookup: {
      from: "users",
      localField: field,
      foreignField: "_id",
      as: field,
    },
  },
  {
    $project: {
      [field]: {
        $map: {
          input: `$${field}`,
          as: "user",
          in: {
            _id: "$$user._id",
            userName: "$$user.userName",
            avatar: "$$user.avatar",
          },
        },
      },
    },
  },
];

export const getImageLink = (
  url: string,
  size:
    | "thumb"
    | "micro"
    | "cover_big"
    | "cover_small"
    | "screenshot_big"
    | "screenshot_med"
    | "screenshot_huge"
    | "logo_med"
    | "720p"
    | "1080p",
  multiply?: number
) => {
  return (
    (url.includes("http") ? "" : "https:") +
    url.replace("thumb", !!multiply ? `${size}_${multiply}x` : size)
  );
};

export const shuffle = <T>(arr: T[]) => {
  let count = arr.length,
    temp,
    index;

  while (count > 0) {
    index = Math.floor(Math.random() * count);
    count--;

    temp = arr[count];
    arr[count] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

export const isSameObjectIdList = (
  current: Types.ObjectId[] | undefined,
  next: Types.ObjectId[]
) => {
  if ((current?.length || 0) !== next.length) return false;
  if (!current?.length) return true;

  const currentKeys = current.map((id) => id.toString()).sort();
  const nextKeys = next.map((id) => id.toString()).sort();

  return currentKeys.every((key, index) => key === nextKeys[index]);
};
