import { Dispatch, FC, SetStateAction } from "react";
import styles from "./PaginationClient.module.scss";
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
  const changePage = (nextPage: number) => {
    if (isWithQuery) {
      const params = new URLSearchParams(window.location.search);
      params.set("page", String(nextPage));
      window.history.pushState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    }

    setPage(nextPage);
  };

  if (!length) return null;

  return (
    <div className={styles.pagination}>
      {page * take < length && (
        <Button onClick={() => changePage(page + 1)}>Show more</Button>
      )}
      {page > 1 && (
        <Button color={ButtonColor.FANCY} onClick={() => changePage(1)}>
          Collapse
        </Button>
      )}
    </div>
  );
};
