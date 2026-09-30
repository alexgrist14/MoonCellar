"use client";

import { FC, useRef, useState } from "react";
import classNames from "classnames";
import { Button, ButtonColor } from "../Button";
import { Popover } from "../Popover";
import { SvgBurger } from "../svg";
import styles from "./TabsMenu.module.scss";

interface ITabsMenuProps {
  tabs: { tabName: string; onTabClick: () => void }[];
  activeIndex: number;
  title?: string;
  className?: string;
}

export const TabsMenu: FC<ITabsMenuProps> = ({
  tabs,
  activeIndex,
  title,
  className,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <Button
        ref={anchorRef}
        type="button"
        color={ButtonColor.DEFAULT}
        className={styles.trigger}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <SvgBurger className={styles.trigger__icon} />
        {tabs[activeIndex]?.tabName}
      </Button>
      <Popover
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        contentStyle={{ padding: "var(--padding-x2)" }}
      >
        <nav className={styles.menu}>
          {tabs.map((tab, index) => (
            <button
              key={tab.tabName}
              type="button"
              aria-current={index === activeIndex ? "page" : undefined}
              className={classNames(styles.menu__item, {
                [styles.menu__item_active]: index === activeIndex,
              })}
              onClick={() => {
                setIsOpen(false);
                tab.onTabClick();
              }}
            >
              {tab.tabName}
            </button>
          ))}
        </nav>
      </Popover>
    </div>
  );
};
