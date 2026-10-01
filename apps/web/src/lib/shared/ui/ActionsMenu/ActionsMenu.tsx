"use client";

import { FC, ReactNode, RefObject, useRef, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import { Button, ButtonColor } from "../Button";
import { Popover } from "../Popover";
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
}

export const ActionsMenu: FC<IActionsMenuProps> = ({
  items,
  label = "Manage",
  isDisabled,
  renderTrigger,
  title,
  width = "220px",
  isNavigation,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [panelLabel, setPanelLabel] = useState<string | null>(null);

  const panel = items.find((item) => item.label === panelLabel)?.panel;

  const close = () => {
    setIsOpen(false);
    setPanelLabel(null);
  };

  const toggle = () => {
    setPanelLabel(null);
    setIsOpen((current) => !current);
  };

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
