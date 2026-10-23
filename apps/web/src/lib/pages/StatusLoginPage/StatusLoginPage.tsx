"use client";

import { FC, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import { isSafeStatusPath } from "@/src/lib/shared/utils/status-path.utils";
import styles from "./StatusLoginPage.module.scss";

export const StatusLoginPage: FC = () => {
  const router = useRouter();
  const next = useSearchParams().get("next");

  useEffect(
    () =>
      useAuthStore.subscribe((state, previous) => {
        if (!state.profile || state.profile === previous.profile) return;
        router.replace(isSafeStatusPath(next) ? next : "/");
        router.refresh();
      }),
    [next, router]
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.page__title}>Sign in to Status</h1>
      <p className={styles.page__hint}>
        Project status for the MoonCellar team.
      </p>
      <AuthModal isPage isSignIn />
    </div>
  );
};
