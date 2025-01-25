import { CSSProperties, FC, ReactNode, useRef, useState } from "react";
import styles from "./MobileMenu.module.scss";
import { createPortal } from "react-dom";
import { WrapperTemplate } from "../WrapperTemplate";
import { useStatesStore } from "../../store/states.store";
import { Button } from "../Button";
import useCloseEvents from "../../hooks/useCloseEvents";
import classNames from "classnames";

interface IMobileMenuProps {
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
  className?: string;
}

export const MobileMenu: FC<IMobileMenuProps> = ({
  children,
  title = "Actions",
  className,
  style,
}) => {
  const { isMobile } = useStatesStore();

  const menuRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useCloseEvents([menuRef], () => setIsActive(false));

  if (isMobile === undefined) return null;

  const connector = document.getElementById("mobile-menu-connector");

  if (!connector) return null;

  return isMobile ? (
    createPortal(
      <div ref={menuRef} className={styles.menu}>
        <div
          style={style}
          className={classNames(
            styles.menu__wrapper,
            className,
            isActive && styles.menu__wrapper_active
          )}
        >
          {children}
        </div>
        <Button
          className={styles.menu__button}
          onClick={() => setIsActive(!isActive)}
        >
          <span>{title}</span>
        </Button>
      </div>,
      connector
    )
  ) : (
    <WrapperTemplate contentStyle={{ padding: "10px" }}>
      {children}
    </WrapperTemplate>
  );
};
