"use client";

import { FC, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import { Box } from "@/src/lib/shared/ui/Box";
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
      <Box wrapperStyle={{ width: "var(--status-card-width)" }}>
        <div className={styles.card}>
          <Image
            src="/images/logo-text.png"
            alt="MoonCellar"
            width={747}
            height={165}
            priority
            className={styles.card__logo}
          />
          <h1 className={styles.card__title}>Sign in to Status</h1>
          <p className={styles.card__hint}>
            Project status for the MoonCellar team.
          </p>
        </div>
        <AuthModal isPage isSignIn />
      </Box>
    </div>
  );
};
