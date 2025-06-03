import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams } from "next/navigation";
import queryString from "query-string";

export const setQuery = (
  value: { [key: string]: string | number },
  router: AppRouterInstance,
  pathname: string,
  query: string
) => {
  const { push } = router;

  push(
    `${pathname}?${queryString.stringify({ ...queryString.parse(query), ...value })}`
  );
};

// export const setPage = (page: number, router: NextRouter) => {
//   setQuery({ page }, router);
// };
