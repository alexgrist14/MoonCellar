import {
  FC,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./ExpandMenu.module.scss";
import { Scrollbar } from "../Scrollbar";
import { useCommonStore } from "../../store/common.store";
import classNames from "classnames";

interface IExpandMenuProps
  extends Pick<HTMLAttributes<HTMLDivElement>, "children" | "id"> {
  position?: "left" | "right";
  titleOpen?: string | ReactNode;
  titleClose?: string | ReactNode;
}

export const ExpandMenu: FC<IExpandMenuProps> = ({
  children,
  position = "left",
  titleClose,
  titleOpen,
  ...props
}) => {
  const expandRef = useRef<HTMLDivElement>(null);
  const { isMobile, expanded, setExpanded } = useCommonStore();

  const [scrollY, setScrollY] = useState(0);

  const isActive = expanded === "both" || expanded === position;

  useEffect(() => {
    const handler = () => {
      setScrollY(window.scrollY);
    };

    document.addEventListener("scroll", handler);
    return () => document.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      ref={expandRef}
      className={classNames(styles.menu, {
        [styles.menu_disabled]:
          isMobile && !isActive && !!expanded && expanded !== "none",
        [styles.menu_right]: position === "right",
        [styles.menu_active]: isActive,
      })}
      style={{
        top: scrollY > 0 ? Math.max(0, 55 - scrollY) : "55px",
        gridTemplateColumns: position === "left" ? "1fr 5px" : "5px 1fr",
        gridTemplateAreas:
          position === "left" ? "'content expand'" : "'expand content'",
      }}
      {...props}
    >
      <Scrollbar type="absolute" stl={styles} className={styles.menu__content}>
        {children}
      </Scrollbar>
      <div
        className={classNames(styles.menu__expand)}
        onClick={() => {
          if (expanded === undefined) return setExpanded(position);
          if (expanded === "both")
            return setExpanded(position === "left" ? "right" : "left");
          if (expanded !== "none" && expanded !== position)
            return setExpanded("both");
          if (expanded === "none" || expanded !== position)
            return setExpanded(position);

          setExpanded("none");
        }}
      >
        <div
          className={styles.menu__title}
          style={{
            borderRadius:
              position === "left"
                ? isActive
                  ? "0 0 0 8px"
                  : "0 0 8px 0"
                : isActive
                ? "0 0 8px 0"
                : "0 0 0 8px",
            transform: `translateX(${
              position === "left"
                ? isActive
                  ? "-50%"
                  : "50%"
                : isActive
                ? "50%"
                : "-50%"
            })`,
          }}
        >
          <span>{isActive ? titleClose || "Close" : titleOpen || "Open"}</span>
        </div>
      </div>
    </div>
  );
};
