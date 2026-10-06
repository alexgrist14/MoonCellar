const isEmpty = (value: unknown) =>
  value == null || value === "" || (Array.isArray(value) && !value.length);

export const pickEmptyFields = <T extends Record<string, unknown>>(
  current: Record<string, unknown>,
  data: T
): Partial<T> =>
  Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) => !isEmpty(value) && isEmpty(current[key])
    )
  ) as Partial<T>;
