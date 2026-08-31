import { isAxiosError } from "axios";
import { notFound } from "next/navigation";

const NOT_FOUND_STATUSES = [400, 404];

export const fetchOrNotFound = async <T>(
  request: Promise<{ data: T }>
): Promise<T> => {
  const response = await request.catch((error: unknown) => {
    if (
      isAxiosError(error) &&
      NOT_FOUND_STATUSES.includes(error.response?.status ?? 0)
    ) {
      notFound();
    }

    throw error;
  });

  if (!response.data) notFound();

  return response.data;
};
