import {
  IGetContentRequests,
  IGetMyContentRequests,
} from "@mooncellar/schemas";

export const requestQueryKeys = {
  all: ["content-requests"] as const,
  mine: (params?: IGetMyContentRequests) =>
    [...requestQueryKeys.all, "mine", ...(params ? [params] : [])] as const,
  list: (params: IGetContentRequests) =>
    [...requestQueryKeys.all, "list", params] as const,
  detail: (id: string) => [...requestQueryKeys.all, "detail", id] as const,
};
