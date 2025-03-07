import { FC, useEffect, useRef, useState } from "react";
import styles from "./Pagination.module.scss";
import { Button } from "../Button";
import { Input } from "../Input";
import { keyboardUtils } from "../../utils/keyboard";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { setPage } from "../../utils/query";

export const Pagination: FC<{
  total: number;
  take: number;
  isFixed?: boolean;
}> = ({ take, total, isFixed }) => {
  const router = useRouter();

  const centerRef = useRef<HTMLDivElement>(null);
  const page = Number(router.query.page || 1);

  const [value, setValue] = useState("");

  const max = Math.ceil(total / take);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [page]);

  if (!total || !page) return null;

  const connector = document.getElementById("pagination-connector");

  if (!connector) return null;

  return createPortal(
    <div
      className={classNames(styles.pagination, {
        [styles.pagination_fixed]: isFixed,
      })}
    >
      <Button
        color="accent"
        className={styles.pagination__button}
        disabled={page === 1}
        onClick={() => {
          setPage(1, router);
        }}
      >
        {"<<"}
      </Button>
      <Button
        color="accent"
        className={styles.pagination__button}
        disabled={page === 1}
        onClick={() => {
          setPage(page - 1, router);
        }}
      >
        {"<"}
      </Button>
      <div className={styles.pagination__center} ref={centerRef}>
        <Input
          containerStyles={{ padding: "4px", width: "75px" }}
          className={styles.pagination__input}
          type="number"
          value={value || page}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={keyboardUtils.blurOnKey}
          onBlur={(e) => {
            const value = Number(e.target.value);

            setPage(value > max ? max : value, router);
          }}
        />
      </div>
      <Button
        color="accent"
        className={styles.pagination__button}
        disabled={page === max}
        onClick={() => {
          setPage(page + 1, router);
        }}
      >
        {">"}
      </Button>
      <Button
        color="accent"
        className={styles.pagination__button}
        disabled={page === max}
        onClick={() => {
          setPage(max, router);
        }}
      >
        {">>"}
      </Button>
    </div>,
    connector
  );
};
