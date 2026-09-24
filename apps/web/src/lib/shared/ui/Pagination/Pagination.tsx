import { memo, RefObject, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Pagination.module.scss";
import { Button, ButtonColor } from "../Button";
import { Input } from "../Input";
import { keyboardUtils } from "@/src/lib/shared/utils/keyboard.utils";
import classNames from "classnames";
import { SvgDoubleArrow } from "../svg/SvgDoubleArrow";
import { SvgArrow } from "../svg/SvgArrow";
import { createPortal } from "react-dom";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { commonUtils, scrollPageToTop } from "@/src/lib/shared/utils/common.utils";

interface IPaginationProps {
  total: number;
  take: number;
  isFixed?: boolean;
  isDisabled?: boolean;
  callback?: (page: number) => void;
  page?: number;
  onPageChange?: (page: number) => void;
  scrollTargetRef?: RefObject<HTMLElement | null>;
  isWithoutSummary?: boolean;
}

export const Pagination = memo(
  ({
    take,
    total,
    isFixed,
    isDisabled,
    callback,
    page: controlledPage,
    onPageChange,
    scrollTargetRef,
    isWithoutSummary,
  }: IPaginationProps) => {
    const { query, setQuery } = useAdvancedRouter();
    const centerRef = useRef<HTMLDivElement>(null);

    const [value, setValue] = useState("");

    const isControlled = controlledPage !== undefined;

    const queryPage = useMemo(() => Number(query.get("page") || 1), [query]);
    const page = isControlled ? controlledPage : queryPage;
    const max = useMemo(() => Math.ceil(total / take), [take, total]);

    const setPage = (page: number) => {
      isControlled ? onPageChange?.(page) : setQuery({ page });
    };

    const changeCallback = (page: number) => {
      if (scrollTargetRef?.current) {
        scrollTargetRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        scrollPageToTop("smooth");
      }

      setValue(page.toString());
      callback?.(page);
    };

    useEffect(() => {
      setValue(page.toString());
    }, [page]);

    if (!total) return null;

    const renderBlock = () => {
      return (
        <div
          className={classNames(styles.pagination, {
            [styles.pagination_fixed]: isFixed,
            [styles.pagination_inline]: !isFixed,
            [styles.pagination_disabled]: isDisabled,
          })}
        >
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.pagination__button}
            tooltip="First page"
            disabled={value === "1" || page === 1}
            onClick={() => {
              const page = 1;

              setPage(page);
              changeCallback(page);
            }}
          >
            <SvgDoubleArrow style={{ rotate: "180deg" }} />
          </Button>
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.pagination__button}
            tooltip="Previous page"
            disabled={value === "1" || page === 1}
            onClick={() => {
              const p = page - 1 || 1;

              setPage(p);
              changeCallback(p);
            }}
          >
            <SvgArrow style={{ rotate: "180deg" }} />
          </Button>
          <div className={styles.pagination__center} ref={centerRef}>
            <Input
              containerStyles={{ padding: "var(--padding-x1)", width: "75px" }}
              className={styles.pagination__input}
              containerClassname={styles.pagination__field}
              type="number"
              value={value || page}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={keyboardUtils.blurOnKey}
              onBlur={(e) => {
                const value = Number(e.target.value);
                const nextPage = value > max ? max : value;

                setPage(nextPage);
                changeCallback(nextPage);
              }}
            />
          </div>
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.pagination__button}
            tooltip="Next page"
            disabled={value === max.toString() || page === max}
            onClick={() => {
              const p = page + 1;

              setPage(p);
              changeCallback(p);
            }}
          >
            <SvgArrow />
          </Button>
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.pagination__button}
            tooltip="Last page"
            disabled={value === max.toString() || page === max}
            onClick={() => {
              const page = max;

              setPage(page);
              changeCallback(page);
            }}
          >
            <SvgDoubleArrow />
          </Button>
        </div>
      );
    };

    const renderInline = () => {
      const from = (page - 1) * take + 1;
      const to = Math.min(page * take, total);

      if (isWithoutSummary) {
        return (
          <nav
            className={classNames(styles.inline, styles.inline_compact)}
            aria-label="Pagination"
          >
            {renderBlock()}
          </nav>
        );
      }

      return (
        <nav className={styles.inline} aria-label="Pagination">
          <p className={styles.inline__summary}>
            Page {page} of {max}
          </p>
          {renderBlock()}
          <p
            className={classNames(
              styles.inline__summary,
              styles.inline__summary_end
            )}
          >
            Showing {from}–{to} of {total}
          </p>
        </nav>
      );
    };

    if (!isFixed) return renderInline();

    const connector = commonUtils.checkWindow(() =>
      document.getElementById("pagination-connector")
    );

    return connector ? createPortal(renderBlock(), connector) : null;
  }
);

Pagination.displayName = "Pagination";
