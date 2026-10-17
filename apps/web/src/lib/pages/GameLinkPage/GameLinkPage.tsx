"use client";

import { FC, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { GameDeviceLink } from "@/src/lib/features/user/ui/GameDeviceLink";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { openAuthModal } from "@/src/lib/shared/ui/AuthModal";
import { Box } from "@/src/lib/shared/ui/Box";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import styles from "./GameLinkPage.module.scss";

export const GameLinkPage: FC = () => {
  const isAuth = useAuthStore((s) => s.isAuth);
  const isAuthChecked = useAuthStore((s) => s.isAuthChecked);
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? undefined;
  const isSignUp = searchParams.get("signup") === "1";
  const isModalOpened = useRef(false);

  useEffect(() => {
    if (!isAuthChecked || isAuth || !code || isModalOpened.current) return;
    isModalOpened.current = true;
    openAuthModal({ isSignIn: !isSignUp });
  }, [isAuthChecked, isAuth, code, isSignUp]);

  return (
    <Box classNameContent={styles.page}>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Link a game", href: "/link" },
        ]}
      />
      <header className={styles.head}>
        <SectionTitle as="h1">Link a game</SectionTitle>
        <p className={styles.lede}>
          Enter the code the game shows to sign it in with your MoonCellar
          account. The game never sees your password.
        </p>
      </header>
      {isAuth ? (
        <GameDeviceLink initialCode={code} />
      ) : (
        <EmptyState
          variant="compact"
          isWithoutImage
          title="Log in to link a game."
          action={
            <Button
              color={ButtonColor.ACCENT}
              onClick={() => openAuthModal({ isSignIn: !isSignUp })}
            >
              {isSignUp ? "Create an account" : "Sign in"}
            </Button>
          }
        />
      )}
    </Box>
  );
};
