import { FC, HTMLAttributes, ReactNode, useRef, useState } from "react";
import styles from "./ExpandMenu.module.scss";
import { Scrollbar } from "../Scrollbar";
import { useCommonStore } from "../../store/common.store";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { useWindowScroll } from "../../hooks/useWindowScroll";
import { useStatesStore } from "../../store/states.store";
import { useResizeDetector } from "react-resize-detector";

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
  const { expanded, setExpanded } = useCommonStore();
  const { isMobile } = useStatesStore();

  const [top, setTop] = useState<string>();

  const isActive = expanded === "both" || expanded === position;

  useWindowScroll(() =>
    setTop(`${window.scrollY > 0 ? Math.max(0, 55 - window.scrollY) : 55}px`)
  );

  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  if (!top) return null;

  return createPortal(
    <div
      ref={expandRef}
      id={position}
      key={position}
      className={classNames(styles.menu, {
        [styles.menu_disabled]:
          isMobile && !isActive && !!expanded && expanded !== "none",
        [styles.menu_right]: position === "right",
        [styles.menu_active]: isActive,
      })}
      style={{
        top,
        height: `calc(100vh - ${top})`,
        gridTemplateColumns: position === "left" ? "1fr 2px" : "2px 1fr",
        gridTemplateAreas:
          position === "left" ? "'content expand'" : "'expand content'",
      }}
      {...props}
    >
      <Scrollbar type="absolute" stl={styles}>
        <div ref={ref}>{children}</div>
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
          className={classNames(
            styles.menu__title,
            styles[`menu__title_${position}`],
            {
              [styles[`menu__title_${position}_active`]]: isActive,
            }
          )}
        >
          <span>{isActive ? titleClose || "Close" : titleOpen || "Open"}</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
