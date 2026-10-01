"use client";

import { FC, ReactNode, useRef, useState } from "react";
import classNames from "classnames";
import { Button, ButtonColor } from "../Button";
import { Popover } from "../Popover";
import { SvgBurger } from "../svg";
import styles from "./TabsMenu.module.scss";

export const TabCount: FC<{ count?: number }> = ({ count }) =>
  count ? <span className={styles.count}>({count})</span> : null;

interface ITabsMenuProps {
  tabs: {
    tabName: string;
    prefix?: ReactNode;
    count?: number;
    ariaLabel?: string;
    isHidden?: boolean;
    onTabClick: () => void;
  }[];
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
        <TabCount count={tabs[activeIndex]?.count} />
      </Button>
      <Popover
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        contentStyle={{ padding: "var(--padding-x2)" }}
      >
        <nav className={styles.menu}>
          {tabs.map((tab, index) =>
            tab.isHidden ? null : (
              <button
                key={tab.tabName}
                type="button"
                aria-label={tab.ariaLabel}
                aria-current={index === activeIndex ? "page" : undefined}
                className={classNames(styles.menu__item, {
                  [styles.menu__item_active]: index === activeIndex,
                })}
                onClick={() => {
                  setIsOpen(false);
                  tab.onTabClick();
                }}
              >
                {!!tab.prefix && (
                  <span className={styles.prefix}>{tab.prefix}</span>
                )}
                {tab.tabName}
                <TabCount count={tab.count} />
              </button>
            )
          )}
        </nav>
      </Popover>
    </div>
  );
};
