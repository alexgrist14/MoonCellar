import { CSSProperties, FC, HTMLAttributes, ReactNode, useRef } from "react";
import styles from "./ExpandMenu.module.scss";
import { Scrollbar } from "../Scrollbar";
import { IExpandPosition, useCommonStore } from "../../store/common.store";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { useStatesStore } from "../../store/states.store";
import { useResizeDetector } from "react-resize-detector";

interface IExpandMenuProps
  extends Pick<HTMLAttributes<HTMLDivElement>, "children" | "id"> {
  position?: IExpandPosition;
  titleOpen?: string | ReactNode;
  titleClose?: string | ReactNode;
  titleClassName?: string;
  menuStyle?: CSSProperties;
  titleStyle?: CSSProperties;
}

export const ExpandMenu: FC<IExpandMenuProps> = ({
  children,
  position = "left",
  titleClose,
  titleOpen,
  titleClassName,
  menuStyle,
  titleStyle,
  ...props
}) => {
  const expandRef = useRef<HTMLDivElement>(null);

  const { expanded, setExpanded } = useCommonStore();
  const { isMobile } = useStatesStore();

  const isActive = expanded?.includes(position);

  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  const connector = document.getElementById("expand-connector");

  if (!connector) return null;

  return createPortal(
    <div
      ref={expandRef}
      id={position}
      key={position}
      className={classNames(styles.menu, {
        [styles.menu_right]: position.includes("right"),
        [styles.menu_disabled]: isMobile && !isActive,
        [styles.menu_active]: isActive,
      })}
      style={{
        ...(position.includes("bottom") && { top: "unset", bottom: "0" }),
        ...menuStyle,
      }}
      {...props}
    >
      <Scrollbar
        type="absolute"
        stl={styles}
        contentStyle={{
          ...(position.includes("bottom")
            ? { paddingBottom: "55px" }
            : { paddingTop: "55px" }),
        }}
      >
        <div
          className={classNames(styles.menu__content, {
            [styles.menu__content_active]: isActive,
          })}
          ref={ref}
        >
          {children}
        </div>
      </Scrollbar>
      <div
        onClick={() => {
          setExpanded(
            isActive
              ? expanded?.filter((pos) => pos !== position) || []
              : !!expanded?.length
                ? [...expanded, position]
                : [position],
          );
        }}
        className={classNames(
          styles.menu__title,
          styles[`menu__title_${position}`],
          titleClassName,
          {
            [styles[`menu__title_${position}_active`]]: isActive,
            [styles.menu__title_bottom]: position.includes("bottom"),
          },
        )}
        style={titleStyle}
      >
        <span>{isActive ? titleClose || "Close" : titleOpen || "Open"}</span>
      </div>
    </div>,
    connector,
  );
};

