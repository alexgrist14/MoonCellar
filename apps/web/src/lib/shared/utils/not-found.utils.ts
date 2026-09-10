import { isAxiosError } from "axios";

const NOT_FOUND_STATUS = 404;

export const fetchOrNull = async <T>(
  request: Promise<{ data: T }>
): Promise<T | null> => {
  const response = await request.catch((error: unknown) => {
    if (isAxiosError(error) && error.response?.status === NOT_FOUND_STATUS) {
      return null;
    }

    throw error;
  });

  return response?.data ?? null;
};
