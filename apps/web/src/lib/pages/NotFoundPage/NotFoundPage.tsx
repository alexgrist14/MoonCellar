"use client";

import Image from "next/image";
import Link from "next/link";
import { Box } from "../../shared/ui/Box";
import { Button, ButtonColor } from "../../shared/ui/Button";
import { SvgMoonBackdrop } from "../../shared/ui/svg";
import styles from "./NotFoundPage.module.scss";

export const NotFoundPage = () => {
  return (
    <Box contentStyle={{ minHeight: "var(--page-height-available)" }}>
      <div className={styles.page}>
        <div className={styles.page__figure}>
          <SvgMoonBackdrop
            color="secondary"
            className={styles.page__backdrop}
          />
          <Image
            className={styles.page__image}
            src="/images/not-found.png"
            alt="Page not found"
            width={416}
            height={664}
            priority
          />
        </div>
        <div className={styles.page__content}>
          <p className={styles.page__code}>404</p>
          <h1 className={styles.page__title}>Oops! Page not found.</h1>
          <p className={styles.page__text}>
            This page drifted off somewhere beyond the dark side of the moon.
            Head back and pick another route.
          </p>
          <Link href="/" className={styles.page__link}>
            <Button color={ButtonColor.ACCENT} className={styles.page__button}>
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </Box>
  );
};
