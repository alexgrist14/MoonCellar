import { NextRouter } from "next/router";
import queryString from "query-string";

export const setQuery = (
  value: { [key: string]: string | number },
  router: NextRouter,
) => {
  const { query, push, pathname } = router;

  push(
    { pathname, query: queryString.stringify({ ...query, ...value }) },
    undefined,
    { shallow: true },
  );
};

export const setPage = (page: number, router: NextRouter) => {
  setQuery({ page }, router);
};
