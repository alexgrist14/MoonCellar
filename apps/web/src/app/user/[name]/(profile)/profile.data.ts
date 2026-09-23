import { cache } from "react";
import { GetUserByStringSchema } from "@mooncellar/schemas";
import { userAPI } from "@/src/lib/shared/api";
import { fetchOrNull } from "@/src/lib/shared/utils/not-found.utils";

const isValidName = (name: string) =>
  GetUserByStringSchema.safeParse({ searchString: name }).success;

export const getProfileUser = cache(async (name: string) =>
  isValidName(name) ? fetchOrNull(userAPI.getByString(name)) : null
);
