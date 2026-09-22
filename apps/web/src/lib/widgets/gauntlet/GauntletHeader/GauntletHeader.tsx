"use client";

import { FC } from "react";
import styles from "./GauntletHeader.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";

export const GauntletHeader: FC = () => (
  <Box contentStyle={{ gap: "var(--gap-x4)" }}>
    <Breadcrumbs
      items={[
        { name: "Home", href: "/" },
        { name: "Gauntlet", href: "/gauntlet" },
      ]}
    />
    <SectionTitle as="h1">Gauntlet</SectionTitle>
    <p className={styles.description}>
      A wheel of fortune over the whole catalogue. Set the filters — platform,
      genre, release year, rating — and spin: the Gauntlet picks one game out of
      everything that matches, so you stop deciding and start playing. Filter
      presets can be saved and reused, and the games that came up are kept in a
      list you can return to.
    </p>
  </Box>
);
