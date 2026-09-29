const releaseDateFormats: Record<number, Intl.DateTimeFormat> = {
  4: new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "UTC" }),
  7: new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }),
  10: new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }),
};

export const parsePartialDate = (date?: string | null) => {
  if (!date || !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(date)) return null;

  const [year, month = 1, day = 1] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

export const toReleaseDate = (value?: string | null) => {
  const date = parsePartialDate(value);

  if (!date) return null;

  return {
    date: Math.floor(+date / 1000),
    human: releaseDateFormats[value.length].format(date),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
};
