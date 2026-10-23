import {
  IGetAdminArticlesRequest,
  IGetArticlesRequest,
} from "@mooncellar/schemas";

export const articleQueryKeys = {
  all: ["articles"] as const,
  feed: (params: IGetArticlesRequest) =>
    [...articleQueryKeys.all, "feed", params] as const,
  archive: () => [...articleQueryKeys.all, "archive"] as const,
  admin: (params: IGetAdminArticlesRequest) =>
    [...articleQueryKeys.all, "admin", params] as const,
  adminDetail: (id: string) =>
    [...articleQueryKeys.all, "admin-detail", id] as const,
};
