import { memo, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Pagination.module.scss";
import { Button, ButtonColor } from "../Button";
import { Input } from "../Input";
import { keyboardUtils } from "../../utils/keyboard.utils";
import classNames from "classnames";
import { SvgDoubleArrow } from "../svg/SvgDoubleArrow";
import { SvgArrow } from "../svg/SvgArrow";
import { createPortal } from "react-dom";
import { useAdvancedRouter } from "../../hooks/useAdvancedRouter";

interface IPaginationProps {
  total: number;
  take: number;
  isFixed?: boolean;
  isDisabled?: boolean;
  callback?: (page: number) => void;
}

export const Pagination = memo(
  ({ take, total, isFixed, isDisabled, callback }: IPaginationProps) => {
    const { query, setQuery } = useAdvancedRouter();
    const centerRef = useRef<HTMLDivElement>(null);

    const [value, setValue] = useState("");

    const page = useMemo(() => Number(query.get("page") || 1), [query]);
    const max = useMemo(() => Math.ceil(total / take), [take, total]);

    const changeCallback = (page: number) => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setValue(page.toString());
      callback?.(page);
    };

    useEffect(() => {
      setValue(page.toString());
    }, [page]);

    if (!total) return null;

    const connector = document.getElementById("pagination-connector");

    if (!connector) return null;

    const renderBlock = () => {
      return (
        <div
          className={classNames(styles.pagination, {
            [styles.pagination_fixed]: isFixed,
            [styles.pagination_disabled]: isDisabled,
          })}
        >
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.pagination__button}
            disabled={value === "1" || page === 1}
            onClick={() => {
              const page = 1;

              setQuery({ page });
              changeCallback(page);
            }}
          >
            <SvgDoubleArrow style={{ rotate: "180deg" }} />
          </Button>
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.pagination__button}
            disabled={value === "1" || page === 1}
            onClick={() => {
              const p = page - 1 || 1;

              setQuery({ page: p });
              changeCallback(p);
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

                setQuery({ page: value > max ? max : value });
                changeCallback(value);
              }}
            />
          </div>
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.pagination__button}
            disabled={value === max.toString() || page === max}
            onClick={() => {
              const p = page + 1;

              setQuery({ page: p });
              changeCallback(p);
            }}
          >
            <SvgArrow />
          </Button>
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.pagination__button}
            disabled={value === max.toString() || page === max}
            onClick={() => {
              const page = max;

              setQuery({ page });
              changeCallback(page);
            }}
          >
            <SvgDoubleArrow />
          </Button>
        </div>
      );
    };

    return isFixed ? createPortal(renderBlock(), connector) : renderBlock();
  }
);

Pagination.displayName = "Pagination";
