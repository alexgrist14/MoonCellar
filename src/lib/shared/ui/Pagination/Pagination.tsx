import { FC, useMemo, useRef, useState } from "react";
import styles from "./Pagination.module.scss";
import { Button } from "../Button";
import { Input } from "../Input";
import { keyboardUtils } from "../../utils/keyboard";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { setPage } from "../../utils/query";
import { SvgDoubleArrow } from "../svg/SvgDoubleArrow";
import { SvgArrow } from "../svg/SvgArrow";
import { useCommonStore } from "../../store/common.store";

export const Pagination: FC<{
  total: number;
  take: number;
  isFixed?: boolean;
  isDisabled?: boolean;
}> = ({ take, total, isFixed, isDisabled }) => {
  const router = useRouter();
  const centerRef = useRef<HTMLDivElement>(null);

  const { setScrollPosition } = useCommonStore();

  const [value, setValue] = useState("");

  const page = useMemo(() => Number(router.query.page || 1), [router]);
  const max = useMemo(() => Math.ceil(total / take), [take, total]);

  const changeCallback = () => {
    setScrollPosition({ left: 0, top: 0 });
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
          setPage(1, router);
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
          setPage(page - 1, router);
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

            setPage(value > max ? max : value, router);
            changeCallback();
          }}
        />
      </div>
      <Button
        color="transparent"
        className={styles.pagination__button}
        disabled={page === max}
        onClick={() => {
          setPage(page + 1, router);
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
          setPage(max, router);
          changeCallback();
        }}
      >
        <SvgDoubleArrow />
      </Button>
    </div>,
    connector
  );
};
