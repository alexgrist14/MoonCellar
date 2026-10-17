"use client";

import { FC } from "react";
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
  const code = useSearchParams().get("code") ?? undefined;

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
            <Button color={ButtonColor.ACCENT} onClick={() => openAuthModal()}>
              Sign in
            </Button>
          }
        />
      )}
    </Box>
  );
};
