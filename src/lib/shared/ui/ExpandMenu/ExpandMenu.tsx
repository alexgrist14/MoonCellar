import { CSSProperties, FC, HTMLAttributes, ReactNode, useMemo } from "react";
import styles from "./ExpandMenu.module.scss";
import { Scrollbar } from "../Scrollbar";
import { IExpandPosition, useCommonStore } from "../../store/common.store";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { useStatesStore } from "../../store/states.store";
import { useResizeDetector } from "react-resize-detector";
import { commonUtils } from "../../utils/common";
import { CheckMobile } from "../CheckMobile";

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
  const { expanded, setExpanded } = useCommonStore();
  const { isMobile } = useStatesStore();

  const isActive = expanded?.includes(position);

  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  const connector = useMemo(
    () =>
      commonUtils.checkWindow(() =>
        document.getElementById("expand-connector")
      ),
    []
  );

  if (!connector) return null;

  return createPortal(
    <CheckMobile>
      <div
        id={position}
        key={position}
        className={classNames(styles.wrapper, {
          [styles.wrapper_right]: position.includes("right"),
          [styles.wrapper_disabled]: isMobile && !isActive,
          [styles.wrapper_active]: isActive,
        })}
        style={{
          ...(position.includes("bottom") && { top: "unset", bottom: "0" }),
          ...menuStyle,
        }}
      >
        <div
          className={classNames(styles.menu, {
            [styles.menu_right]: position.includes("right"),
            [styles.menu_disabled]: isMobile && !isActive,
            [styles.menu_active]: isActive,
          })}
          style={menuStyle}
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
            <div className={classNames(styles.menu__content)} ref={ref}>
              {children}
            </div>
          </Scrollbar>
        </div>
        <div
          onClick={() => {
            setExpanded(
              isActive
                ? expanded?.filter((pos) => pos !== position) || []
                : !!expanded?.length
                  ? [...expanded, position]
                  : [position]
            );
          }}
          className={classNames(
            styles.title,
            styles[`title_${position}`],
            titleClassName,
            {
              [styles[`title_${position}_active`]]: isActive,
              [styles.title_bottom]: position.includes("bottom"),
            }
          )}
          style={titleStyle}
        >
          <span>{isActive ? titleClose || "Close" : titleOpen || "Open"}</span>
        </div>
      </div>
    </CheckMobile>,
    connector
  );
};
