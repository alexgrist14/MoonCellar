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
