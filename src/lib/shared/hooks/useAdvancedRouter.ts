import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useAdvancedRouter = () => {
  const pathname = usePathname();
  const query = useSearchParams();
  const router = useRouter();
  const queryString = query.toString();
  const asPath = pathname + (!!queryString ? `?${queryString}` : "");

  return { pathname, query, router, queryString, asPath };
};
