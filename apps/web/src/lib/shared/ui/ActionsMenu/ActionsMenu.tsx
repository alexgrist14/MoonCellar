"use client";

import { FC, ReactNode, RefObject, useRef, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import { Button, ButtonColor } from "../Button";
import { EmptyState } from "../EmptyState";
import { Input } from "../Input";
import { Popover } from "../Popover";
import { Scrollbar } from "../Scrollbar";
import styles from "./ActionsMenu.module.scss";

export interface IActionsMenuPanel {
  title?: string;
  width?: string;
  render: (controls: { back: () => void; close: () => void }) => ReactNode;
}

interface IActionsMenuItemBase {
  label: string;
  isDanger?: boolean;
  isDisabled?: boolean;
}

export type IActionsMenuItem = IActionsMenuItemBase &
  (
    | { onClick: () => void; href?: never; panel?: never }
    | { href: string; isExternal?: boolean; onClick?: never; panel?: never }
    | { panel: IActionsMenuPanel; onClick?: never; href?: never }
  );

export interface IActionsMenuTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  toggle: () => void;
}

interface IActionsMenuProps {
  items: IActionsMenuItem[];
  label?: string;
  isDisabled?: boolean;
  renderTrigger?: (props: IActionsMenuTriggerProps) => ReactNode;
  title?: string;
  width?: string;
  isNavigation?: boolean;
  searchPlaceholder?: string;
}

export const ActionsMenu: FC<IActionsMenuProps> = ({
  items,
  label = "Manage",
  isDisabled,
  renderTrigger,
  title,
  width = "220px",
  isNavigation,
  searchPlaceholder,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [panelLabel, setPanelLabel] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const panel = items.find((item) => item.label === panelLabel)?.panel;

  const close = () => {
    setIsOpen(false);
    setPanelLabel(null);
    setSearch("");
  };

  const toggle = () => {
    setPanelLabel(null);
    setSearch("");
    setIsOpen((current) => !current);
  };

  const needle = search.trim().toLowerCase();
  const visibleItems = needle
    ? items.filter((item) => item.label.toLowerCase().includes(needle))
    : items;

  const itemRole = isNavigation ? undefined : "menuitem";

  const renderItem = (item: IActionsMenuItem) => {
    const className = classNames(styles.menu__item, {
      [styles.menu__item_danger]: item.isDanger,
    });

    if (item.href !== undefined && !item.isDisabled) {
      return (
        <Link
          key={item.label}
          href={item.href}
          role={itemRole}
          className={className}
          target={item.isExternal ? "_blank" : undefined}
          rel={item.isExternal ? "noopener noreferrer" : undefined}
          onClick={close}
        >
          {item.label}
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        role={itemRole}
        disabled={item.isDisabled}
        className={className}
        onClick={() => {
          if (item.panel) {
            setPanelLabel(item.label);
            return;
          }
          close();
          item.onClick?.();
        }}
      >
        {item.label}
      </button>
    );
  };

  const List = isNavigation ? "nav" : "div";

  return (
    <div onClick={(event) => event.stopPropagation()}>
      {renderTrigger ? (
        renderTrigger({ ref: anchorRef, isOpen, toggle })
      ) : (
        <Button
          ref={anchorRef}
          type="button"
          color={ButtonColor.DEFAULT}
          disabled={isDisabled}
          aria-expanded={isOpen}
          onClick={toggle}
        >
          {label}
        </Button>
      )}
      <Popover
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={close}
        align="end"
        title={panel ? (panel.title ?? title) : title}
        width={panel?.width ?? width}
        contentStyle={{ padding: "var(--padding-x2)" }}
      >
        {panel ? (
          panel.render({ back: () => setPanelLabel(null), close })
        ) : searchPlaceholder !== undefined ? (
          <div className={styles.search}>
            <Input
              value={search}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Scrollbar
              type="absolute"
              contentStyle={{
                maxHeight: "var(--popover-max-height)",
                paddingLeft: 0,
              }}
            >
              <List
                className={styles.menu}
                role={isNavigation ? undefined : "menu"}
              >
                {visibleItems.map(renderItem)}
              </List>
              {!visibleItems.length && (
                <EmptyState
                  variant="compact"
                  isWithoutImage
                  title={`Nothing matches “${search}”`}
                />
              )}
            </Scrollbar>
          </div>
        ) : (
          <List
            className={styles.menu}
            role={isNavigation ? undefined : "menu"}
          >
            {items.map(renderItem)}
          </List>
        )}
      </Popover>
    </div>
  );
};
