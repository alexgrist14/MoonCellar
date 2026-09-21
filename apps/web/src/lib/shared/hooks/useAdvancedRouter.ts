import { usePathname, useRouter, useSearchParams } from "next/navigation";
import queryString from "query-string";

export const useAdvancedRouter = () => {
  const pathname = usePathname();
  const query = useSearchParams();
  const router = useRouter();
  const queryStr = query.toString();
  const asPath = pathname + (!!queryStr ? `?${queryStr}` : "");
  const setQuery = (value: { [key: string]: string | number }) => {
    const { push } = router;

    push(
      `${pathname}?${queryString.stringify({ ...queryString.parse(queryStr), ...value })}`
    );
  };

  return { pathname, query, router, queryString: queryStr, asPath, setQuery };
};
