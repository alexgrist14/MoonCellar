import { IGetContentRequests } from "@mooncellar/schemas";

export const requestQueryKeys = {
  all: ["content-requests"] as const,
  mine: () => [...requestQueryKeys.all, "mine"] as const,
  list: (params: IGetContentRequests) =>
    [...requestQueryKeys.all, "list", params] as const,
  detail: (id: string) => [...requestQueryKeys.all, "detail", id] as const,
};
