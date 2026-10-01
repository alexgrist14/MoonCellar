"use client";

import { FC } from "react";
import { useAuth } from "@/src/lib/shared/hooks/auth";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import { ActionsMenu } from "@/src/lib/shared/ui/ActionsMenu";
import { openAuthModal } from "@/src/lib/shared/ui/AuthModal";
import { getProfileHref } from "@/src/lib/shared/utils/links.utils";
import styles from "./UserMenu.module.scss";

export const UserMenu: FC = () => {
  const { isAuth, isAdmin, profile } = useAuthStore();
  const { logout } = useAuth();

  if (!isAuth || !profile) {
    return (
      <button
        type="button"
        className={styles.trigger}
        aria-label="Sign in"
        onClick={() => openAuthModal()}
      >
        <Avatar user={profile} isWithoutTooltip priority />
      </button>
    );
  }

  return (
    <ActionsMenu
      isNavigation
      renderTrigger={({ ref, isOpen, toggle }) => (
        <button
          ref={ref}
          type="button"
          className={styles.trigger}
          aria-label="Account menu"
          aria-expanded={isOpen}
          onClick={toggle}
        >
          <Avatar user={profile} isWithoutTooltip priority />
        </button>
      )}
      items={[
        { label: "Profile", href: getProfileHref(profile.userName) },
        { label: "Games", href: getProfileHref(profile.userName, "all") },
        { label: "Lists", href: getProfileHref(profile.userName, "lists") },
        { label: "Reviews", href: getProfileHref(profile.userName, "reviews") },
        { label: "Requests", href: "/requests" },
        ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
        {
          label: "Settings",
          href: getProfileHref(profile.userName, "settings"),
        },
        {
          label: "Logout",
          onClick: () => logout(profile._id),
          isDanger: true,
        },
      ]}
    />
  );
};
