"use client";

import Image from "next/image";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SvgMoonBackdrop } from "@/src/lib/shared/ui/svg";
import styles from "./NotFoundPage.module.scss";

export const NotFoundPage = () => {
  return (
    <Box contentStyle={{ minHeight: "var(--page-height-available)" }}>
      <EmptyState
        variant="page"
        as="h1"
        eyebrow="404"
        title="Oops! Page not found."
        description="This page drifted off somewhere beyond the dark side of the moon. Head back and pick another route."
        icon={
          <div className={styles.figure}>
            <SvgMoonBackdrop color="secondary" className={styles.backdrop} />
            <Image
              className={styles.image}
              src="/images/not-found.png"
              alt="Page not found"
              width={416}
              height={664}
              priority
            />
          </div>
        }
        action={
          <Button href="/" color={ButtonColor.ACCENT}>
            Back to home
          </Button>
        }
      />
    </Box>
  );
};
