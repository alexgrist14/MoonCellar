import {
  CSSProperties,
  HTMLAttributes,
  memo,
  ReactNode,
  useMemo,
  useRef,
} from "react";
import styles from "./ExpandMenu.module.scss";
import { Scrollbar } from "../Scrollbar";
import { IExpandPosition } from "../../store/common.store";
import classNames from "classnames";
import { useStatesStore } from "../../store/states.store";
import { useResizeDetector } from "react-resize-detector";
import { useExpandStore } from "../../store/expand.store";
import { commonUtils } from "../../utils/common.utils";
import { CheckMobile } from "../CheckMobile";
import { createPortal } from "react-dom";
import useCloseEvents from "../../hooks/useCloseEvents";

interface IExpandMenuProps
  extends Pick<HTMLAttributes<HTMLDivElement>, "children" | "id"> {
  position?: IExpandPosition;
  titleOpen?: string | ReactNode;
  titleClose?: string | ReactNode;
  titleClassName?: string;
  menuStyle?: CSSProperties;
  titleStyle?: CSSProperties;
}

export const ExpandMenu = memo(
  ({
    children,
    position = "left",
    titleClose,
    titleOpen,
    titleClassName,
    menuStyle,
    titleStyle,
    ...props
  }: IExpandMenuProps) => {
    const { expanded, setExpanded } = useExpandStore();
    const { isMobile } = useStatesStore();

    const expandRef = useRef<HTMLDivElement>(null);

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

    const closeHandler = () =>
      isActive &&
      setExpanded(expanded?.filter((pos) => pos !== position) || []);

    useCloseEvents([expandRef], () => closeHandler());

    if (!connector) return null;

    return createPortal(
      <CheckMobile>
        <div
          id={position}
          key={position}
          ref={expandRef}
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
              isActive
                ? closeHandler()
                : setExpanded(
                    !!expanded?.length ? [...expanded, position] : [position]
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
            <span>
              {isActive ? titleClose || "Close" : titleOpen || "Open"}
            </span>
          </div>
        </div>
      </CheckMobile>,
      connector
    );
  }
);

ExpandMenu.displayName = "ExpandMenu";
