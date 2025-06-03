import { FC, useMemo, useRef, useState } from "react";
import styles from "./Pagination.module.scss";
import { Button } from "../Button";
import { Input } from "../Input";
import { keyboardUtils } from "../../utils/keyboard";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { SvgDoubleArrow } from "../svg/SvgDoubleArrow";
import { SvgArrow } from "../svg/SvgArrow";
import { useCommonStore } from "../../store/common.store";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { setQuery } from "../../utils/query";

export const Pagination: FC<{
  total: number;
  take: number;
  isFixed?: boolean;
  isDisabled?: boolean;
  callback?: () => void;
}> = ({ take, total, isFixed, isDisabled, callback }) => {
  const router = useRouter();
  const centerRef = useRef<HTMLDivElement>(null);
  const query = useSearchParams();
  const pathname = usePathname();

  const { setScrollPosition } = useCommonStore();

  const [value, setValue] = useState("");

  const page = useMemo(() => Number(query.get("page") || 1), [query]);
  const max = useMemo(() => Math.ceil(total / take), [take, total]);

  const changeCallback = () => {
    setScrollPosition({ left: 0, top: 0 });
    callback?.();
  };

  if (!total || !page) return null;

  const connector = document.getElementById("pagination-connector");

  if (!connector) return null;

  return createPortal(
    <div
      className={classNames(styles.pagination, {
        [styles.pagination_fixed]: isFixed,
        [styles.pagination_disabled]: isDisabled,
      })}
    >
      <Button
        color="transparent"
        className={styles.pagination__button}
        disabled={page === 1}
        onClick={() => {
          setQuery({ page: 1 }, router, pathname, query.toString());
          changeCallback();
        }}
      >
        <SvgDoubleArrow style={{ rotate: "180deg" }} />
      </Button>
      <Button
        color="transparent"
        className={styles.pagination__button}
        disabled={page === 1}
        onClick={() => {
          setQuery({ page: page - 1 }, router, pathname, query.toString());
          changeCallback();
        }}
      >
        <SvgArrow style={{ rotate: "180deg" }} />
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

            setQuery(
              { page: value > max ? max : value },
              router,
              pathname,
              query.toString()
            );
            changeCallback();
          }}
        />
      </div>
      <Button
        color="transparent"
        className={styles.pagination__button}
        disabled={page === max}
        onClick={() => {
          setQuery({ page: page + 1 }, router, pathname, query.toString());
          changeCallback();
        }}
      >
        <SvgArrow />
      </Button>
      <Button
        color="transparent"
        className={styles.pagination__button}
        disabled={page === max}
        onClick={() => {
          setQuery({ page: max }, router, pathname, query.toString());
          changeCallback();
        }}
      >
        <SvgDoubleArrow />
      </Button>
    </div>,
    connector
  );
};
