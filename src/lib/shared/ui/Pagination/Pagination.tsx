import { FC, useCallback, useEffect, useRef, useState } from "react";
import styles from "./Pagination.module.scss";
import { Button } from "../Button";
import { Input } from "../Input";
import { keyboardUtils } from "../../utils/keyboard";
import classNames from "classnames";
import { Tooltip } from "../Tooltip";
import { useWindowScroll } from "../../hooks/useWindowScroll";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import queryString from "query-string";

export const Pagination: FC<{
  total: number;
  take: number;
  isFixed?: boolean;
}> = ({ take, total, isFixed }) => {
  const { query, push, pathname } = useRouter();

  const centerRef = useRef<HTMLDivElement>(null);
  const page = Number(query.page);

  const [top, setTop] = useState<string>();
  const [isHover, setIsHover] = useState(false);
  const [value, setValue] = useState("");

  const max = Math.ceil(total / take);

  const setPage = useCallback(
    (page: number) => {
      push(
        { pathname, query: queryString.stringify({ ...query, page }) },
        undefined,
        { shallow: true }
      );
    },
    [pathname, push, query]
  );

  useWindowScroll(() =>
    setTop(`${window.scrollY > 0 ? Math.max(0, 55 - window.scrollY) : 55}px`)
  );

  useEffect(() => {
    !query.page && setPage(1);
  }, [setPage, query]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [page]);

  if (!page) return null;

  return createPortal(
    <div
      className={classNames(styles.pagination, {
        [styles.pagination_fixed]: isFixed,
      })}
      style={{ top }}
    >
      <Button
        color="accent"
        className={styles.pagination__button}
        disabled={page === 1}
        onClick={() => {
          setPage(1);
        }}
      >
        {"<<"}
      </Button>
      <Button
        color="accent"
        className={styles.pagination__button}
        disabled={page === 1}
        onClick={() => {
          setPage(page - 1);
        }}
      >
        {"<"}
      </Button>
      <div className={styles.pagination__center} ref={centerRef}>
        <Tooltip
          isActive={isHover}
          positionRef={centerRef}
          className={styles.pagination__tooltip}
        >{`${page} of ${max}`}</Tooltip>
        <Input
          onMouseOver={() => setIsHover(true)}
          onMouseOut={() => setIsHover(false)}
          style={{ padding: "4px", width: "75px" }}
          className={styles.pagination__input}
          type="number"
          value={value || page}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={keyboardUtils.blurOnKey}
          onBlur={(e) => {
            const value = Number(e.target.value);

            setPage(value > max ? max : value);
          }}
        />
      </div>
      <Button
        color="accent"
        className={styles.pagination__button}
        disabled={page === max}
        onClick={() => {
          setPage(page + 1);
        }}
      >
        {">"}
      </Button>
      <Button
        color="accent"
        className={styles.pagination__button}
        disabled={page === max}
        onClick={() => {
          setPage(max);
        }}
      >
        {">>"}
      </Button>
    </div>,
    document.body
  );
};
