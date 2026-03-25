import { Dispatch, FC, SetStateAction } from "react";
import styles from "./PaginationClient.module.scss";
import { usePathname, useRouter } from "next/navigation";
import queryString from "query-string";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";

interface IPaginationClientProps {
  take: number;
  length?: number;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  isWithQuery?: boolean;
}

export const PaginationClient: FC<IPaginationClientProps> = ({
  take,
  page,
  length,
  setPage,
  isWithQuery,
}) => {
  const { push } = useRouter();
  const pathname = usePathname();

  const nextPage = () => {
    isWithQuery &&
      push(pathname + "?" + queryString.stringify({ page: page + 1 }), {
        scroll: false,
      });
    setPage(page + 1);
  };

  const resetPage = () => {
    isWithQuery &&
      push(pathname + "?" + queryString.stringify({ page: 1 }), {
        scroll: false,
      });
    setPage(1);
  };

  if (!length) return null;

  return (
    <div className={styles.pagination}>
      {page * take < length && <Button onClick={nextPage}>Show more</Button>}
      {page > 1 && (
        <Button color={ButtonColor.FANCY} onClick={resetPage}>
          Collapse
        </Button>
      )}
    </div>
  );
};
