"use client";

import { FC, useRef, useState } from "react";
import classNames from "classnames";
import { Button, ButtonColor } from "../Button";
import { Popover } from "../Popover";
import styles from "./ActionsMenu.module.scss";

export interface IActionsMenuItem {
  label: string;
  onClick: () => void;
  isDanger?: boolean;
  isDisabled?: boolean;
}

interface IActionsMenuProps {
  items: IActionsMenuItem[];
  label?: string;
  isDisabled?: boolean;
}

export const ActionsMenu: FC<IActionsMenuProps> = ({
  items,
  label = "Manage",
  isDisabled,
}) => {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Button
        ref={anchorRef}
        type="button"
        color={ButtonColor.DEFAULT}
        disabled={isDisabled}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {label}
      </Button>
      <Popover
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        align="end"
        width="220px"
        contentStyle={{ padding: "var(--padding-x2)" }}
      >
        <div className={styles.menu} role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.isDisabled}
              className={classNames(styles.menu__item, {
                [styles.menu__item_danger]: item.isDanger,
              })}
              onClick={() => {
                setIsOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Popover>
    </div>
  );
};
