export const setPagination = (page: number | string, take: number | string) => {
  return [{ $skip: (+page - 1) * +take }, { $limit: +take }];
};
