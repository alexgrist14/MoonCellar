import { isAxiosError } from "axios";
import {
  IPossibleDuplicatesError,
  POSSIBLE_DUPLICATES_MESSAGE,
} from "@mooncellar/schemas";

const CONFLICT_STATUS = 409;

export const getPossibleDuplicates = (error: unknown) => {
  if (!isAxiosError<IPossibleDuplicatesError>(error)) return null;
  if (error.response?.status !== CONFLICT_STATUS) return null;

  const data = error.response.data;

  return data?.message === POSSIBLE_DUPLICATES_MESSAGE &&
    data.duplicates?.length
    ? data.duplicates
    : null;
};
