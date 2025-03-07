import {CSSProperties, FC, HTMLAttributes, ReactNode, useRef } from "react";
import styles from "./ExpandMenu.module.scss";
import { Scrollbar } from "../Scrollbar";
import { useCommonStore } from "../../store/common.store";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { useStatesStore } from "../../store/states.store";
import { useResizeDetector } from "react-resize-detector";

interface IExpandMenuProps
  extends Pick<HTMLAttributes<HTMLDivElement>, "children" | "id"> {
  position?: "left" | "right";
  titleOpen?: string | ReactNode;
  titleClose?: string | ReactNode;
  titleClassName?: string;
  menuStyle?: CSSProperties;
}

export const ExpandMenu: FC<IExpandMenuProps> = ({
  children,
  position = "left",
  titleClose,
  titleOpen,
  titleClassName,
  menuStyle,
  ...props
}) => {
  const expandRef = useRef<HTMLDivElement>(null);
  const { expanded, setExpanded } = useCommonStore();
  const { isMobile } = useStatesStore();

  const isActive = expanded === "both" || expanded === position;

  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  if (isMobile === undefined) return null;
  
  const connector = document.getElementById("expand-connector");

  if (!connector) return null;

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
        ...(position === "left" ? { gridTemplateColumns: "1fr 2px" } : { gridTemplateColumns: "2px 1fr" }),
        ...(position === "left" ? { gridTemplateAreas: "'content expand'" } : { gridTemplateAreas: "'expand content'" }),
        ...menuStyle,
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
            titleClassName,
            {
              [styles[`menu__title_${position}_active`]]: isActive,
            }
          )}
        >
          <span>{isActive ? titleClose || "Close" : titleOpen || "Open"}</span>
        </div>
      </div>
    </div>,
    connector
  );
};
