import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./Pagination.module.scss";
import { Button } from "../Button";
import { Input } from "../Input";
import { keyboardUtils } from "../../utils/keyboard";
import classNames from "classnames";
import { Tooltip } from "../Tooltip";
import { useWindowScroll } from "../../hooks/useWindowScroll";
import { createPortal } from "react-dom";

export const Pagination: FC<{
  total: number;
  page: number;
  take: number;
  setPage: Dispatch<SetStateAction<number>>;
  isFixed?: boolean;
}> = ({ page, setPage, take, total, isFixed }) => {
  const centerRef = useRef<HTMLDivElement>(null);

  const [value, setValue] = useState("");
  const [top, setTop] = useState<string>();
  const [isHover, setIsHover] = useState(false);

  const max = Math.ceil(total / take);

  useWindowScroll(() =>
    setTop(`${window.scrollY > 0 ? Math.max(0, 55 - window.scrollY) : 55}px`)
  );

  useEffect(() => {
    setValue(page.toString());
  }, [page]);

  if (!value) return null;

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
        >{`${page} of ${max}`}</Tooltip>
        <Input
          onMouseOver={() => setIsHover(true)}
          onMouseOut={() => setIsHover(false)}
          style={{ padding: "4px", width: "75px" }}
          className={styles.pagination__input}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={keyboardUtils.blurOnKey}
          onBlur={(e) => {
            const value = Number(e.target.value);

            if (!value) return setValue(page.toString());

            if (value > max) {
              setValue(max.toString());
              setPage(max);
            } else {
              setPage(value);
            }
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
