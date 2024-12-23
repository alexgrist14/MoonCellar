import { NextRouter } from "next/router";
import queryString from "query-string";

// const addQuery = (router: NextRouter) => {
//   const { query, push, asPath } = router;
//   return push({ pathname: asPath, query }, undefined, { shallow: true });
// };

export const setPage = (page: number, router: NextRouter) => {
  const { query, push, pathname } = router;

  push(
    { pathname, query: queryString.stringify({ ...query, page }) },
    undefined,
    { shallow: true }
  );
};
