export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const findBySlug = <T>(
  items: T[],
  slug: string,
  getName: (item: T) => string
) => items.find((item) => toSlug(getName(item)) === slug);
