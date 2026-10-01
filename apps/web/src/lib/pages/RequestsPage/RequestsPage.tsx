"use client";

import { FC } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { openAuthModal } from "@/src/lib/shared/ui/AuthModal";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { UserRequests } from "@/src/lib/widgets/requests/UserRequests";
import styles from "./RequestsPage.module.scss";

export const RequestsPage: FC = () => {
  const isAuth = useAuthStore((s) => s.isAuth);
  const searchParams = useSearchParams();

  const kind = searchParams.get("kind") === "character" ? "character" : "game";
  const targetId = searchParams.get("targetId");
  const targetName = searchParams.get("targetName");

  return (
    <Box classNameContent={styles.page}>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Requests", href: "/requests" },
        ]}
      />
      <header className={styles.head}>
        <SectionTitle as="h1">Suggest a game or a character</SectionTitle>
        <p className={styles.lede}>
          Something missing or wrong in the catalogue? Send it here. A moderator
          reviews every request before it reaches the site.
        </p>
      </header>
      {isAuth ? (
        <UserRequests
          initialKind={kind}
          initialTarget={
            targetId && targetName
              ? { id: targetId, label: targetName }
              : undefined
          }
        />
      ) : (
        <EmptyState
          variant="compact"
          isWithoutImage
          title="Log in to send a request."
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
