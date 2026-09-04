import { isAxiosError } from "axios";

const NOT_FOUND_STATUSES = [400, 404];

export const fetchOrNull = async <T>(
  request: Promise<{ data: T }>
): Promise<T | null> => {
  const response = await request.catch((error: unknown) => {
    if (
      isAxiosError(error) &&
      NOT_FOUND_STATUSES.includes(error.response?.status ?? 0)
    ) {
      return null;
    }

    throw error;
  });

  return response?.data ?? null;
};
