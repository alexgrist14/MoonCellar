"use client";

import { FC, useRef, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import { useAuth } from "@/src/lib/shared/hooks/auth";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { modal } from "@/src/lib/shared/ui/Modal";
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import { getProfileHref } from "@/src/lib/shared/utils/links.utils";
import styles from "./UserMenu.module.scss";

export const UserMenu: FC = () => {
  const { isAuth, isAdmin, profile } = useAuthStore();
  const { logout } = useAuth();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  if (!isAuth || !profile) {
    return (
      <button
        type="button"
        className={styles.trigger}
        aria-label="Sign in"
        onClick={() => modal.open(<AuthModal />)}
      >
        <Avatar user={profile} isWithoutTooltip priority />
      </button>
    );
  }

  const links = [
    { label: "Profile", href: getProfileHref(profile.userName) },
    { label: "Games", href: getProfileHref(profile.userName, "all") },
    { label: "Lists", href: getProfileHref(profile.userName, "lists") },
    { label: "Requests", href: "/requests" },
    ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
    { label: "Settings", href: getProfileHref(profile.userName, "settings") },
  ];

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={styles.trigger}
        aria-label="Account menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Avatar user={profile} isWithoutTooltip priority />
      </button>
      <Popover
        anchorRef={anchorRef}
        isOpen={isOpen}
        onClose={close}
        align="end"
        width="220px"
        title={profile.userName}
        contentStyle={{ padding: "var(--padding-x2)" }}
      >
        <nav className={styles.menu}>
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={styles.menu__item}
              onClick={close}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            className={classNames(styles.menu__item, styles.menu__item_danger)}
            onClick={() => {
              close();
              logout(profile._id);
            }}
          >
            Logout
          </button>
        </nav>
      </Popover>
    </>
  );
};
