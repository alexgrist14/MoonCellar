import {
  FC,
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./ExpandMenu.module.scss";
import classNames from "classnames";
import { Scrollbar } from "../Scrollbar";
import { useCommonStore } from "../../store/common.store";
import { useRouter } from "next/router";
import { useWindowResizeAction } from "../../hooks";

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
  const { asPath } = useRouter();
  const expandRef = useRef<HTMLDivElement>(null);
  const { expandPosition, isMobile, setExpandPosition, expanded } =
    useCommonStore();

  const [isActive, setIsActive] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const isNotExtendedMobile =
    !!expandPosition && expandPosition !== position && isMobile;

  useEffect(() => {
    setExpandPosition(isActive ? position : undefined);
  }, [isActive, setExpandPosition, position]);

  useEffect(() => {
    if (expanded === "none") {
      setIsActive(false);
    } else {
      setIsActive(position === expanded || expanded === "both");
    }
  }, [expanded, position]);

  useEffect(() => {
    setIsActive(false);
  }, [asPath]);

  // useCloseEvents([expandRef], () => setIsActive(false));
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
        [styles.menu_active]: !isActive,
      })}
      style={{
        top: scrollY > 0 ? Math.max(0, 55 - scrollY) : "55px",
        pointerEvents: isNotExtendedMobile ? "none" : "auto",
        opacity: isNotExtendedMobile ? "0" : "1",
        right: position === "right" ? "0" : "unset",
        gridTemplateColumns: position === "left" ? "1fr 5px" : "5px 1fr",
        gridTemplateAreas:
          position === "left" ? "'content expand'" : "'expand content'",
        transform: !isActive
          ? position === "right"
            ? "translateX(calc(100% - 5px))"
            : "translateX(calc(-100% + 5px)"
          : "none",
      }}
      {...props}
    >
      <Scrollbar type="absolute" stl={styles} className={styles.menu__content}>
        {children}
      </Scrollbar>
      <div
        className={styles.menu__expand}
        onClick={() => setIsActive(!isActive)}
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
