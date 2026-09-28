import {
  CustomListGamesSortSchema,
  CustomListsOrderSchema,
  ICustomListSort,
} from "@mooncellar/schemas";

export const LIST_SORT_PARAM = "sort";
export const LIST_ORDER_PARAM = "order";

export const parseListSortQuery = (
  get: (key: string) => string | null | undefined
): ICustomListSort => {
  const sortBy = CustomListGamesSortSchema.safeParse(get(LIST_SORT_PARAM));
  const sortOrder = CustomListsOrderSchema.safeParse(get(LIST_ORDER_PARAM));

  return {
    ...(sortBy.success ? { sortBy: sortBy.data } : {}),
    ...(sortOrder.success ? { sortOrder: sortOrder.data } : {}),
  };
};
