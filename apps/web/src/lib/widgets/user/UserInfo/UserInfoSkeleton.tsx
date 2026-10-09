import { FC } from "react";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { StatTile } from "@/src/lib/shared/ui/StatTile";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { ListCardsGrid } from "@/src/lib/shared/ui/ListCardsGrid";
import { ActivityTimelineSkeleton } from "@/src/lib/features/user/ui/ActivityTimeline";
import styles from "./UserInfo.module.scss";

const sectionTitle = (
  <SectionTitle as="h3">
    <Skeleton shape="text" width="var(--page-skeleton-title-width)" />
  </SectionTitle>
);

export const UserInfoSkeleton: FC = () => (
  <div className={styles.profile} aria-hidden>
    <header className={styles.hero}>
      <div className={styles.hero__banner}>
        <Skeleton height="100%" radius="0" />
      </div>
      <div className={styles.hero__head}>
        <div className={styles.hero__avatar}>
          <Skeleton height="100%" radius="0" />
        </div>
        <div className={styles.hero__main}>
          <div className={styles.hero__name}>
            <Skeleton shape="text" width="40%" />
          </div>
          <div className={styles.hero__seen}>
            <Skeleton shape="text" width="25%" />
          </div>
        </div>
      </div>
    </header>
    <div className={styles.counters}>
      {Array.from({ length: 4 }, (_, index) => (
        <StatTile key={index} isLoading />
      ))}
    </div>
    <section className={styles.lists}>
      {sectionTitle}
      <ListCardsGrid maxRows={1} isGameSized>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton
            key={index}
            aspectRatio="var(--cover-ratio)"
            radius="var(--radius-x4)"
          />
        ))}
      </ListCardsGrid>
    </section>
    <section className={styles.lists}>
      {sectionTitle}
      <ActivityTimelineSkeleton />
    </section>
  </div>
);
