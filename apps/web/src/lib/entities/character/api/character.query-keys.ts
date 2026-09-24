import { IGetAdminCharacters } from "@mooncellar/schemas";

export const characterQueryKeys = {
  all: ["characters"] as const,
  search: (search: string) =>
    [...characterQueryKeys.all, "search", search] as const,
  admin: (params: IGetAdminCharacters) =>
    [...characterQueryKeys.all, "admin", params] as const,
};
