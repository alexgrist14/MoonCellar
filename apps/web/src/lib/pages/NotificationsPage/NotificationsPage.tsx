"use client";

import { FC, useState } from "react";
import {
  useMarkNotificationsReadMutation,
  useUnreadNotificationsQuery,
} from "@/src/lib/entities/notification/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { openAuthModal } from "@/src/lib/shared/ui/AuthModal";
import { Box } from "@/src/lib/shared/ui/Box";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { NotificationsFeed } from "@/src/lib/widgets/notifications/NotificationsFeed";
import styles from "./NotificationsPage.module.scss";

const ALL_TAB = 0;
const UNREAD_TAB = 1;

export const NotificationsPage: FC = () => {
  const isAuth = useAuthStore((s) => s.isAuth);
  const [tabIndex, setTabIndex] = useState(ALL_TAB);
  const { data: unreadCount = 0 } = useUnreadNotificationsQuery(isAuth);
  const { mutate: markRead, isPending } = useMarkNotificationsReadMutation();

  return (
    <Box classNameContent={styles.page}>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Notifications", href: "/notifications" },
        ]}
      />
      <header className={styles.head}>
        <SectionTitle as="h1">Notifications</SectionTitle>
        {isAuth && (
          <Button
            color={ButtonColor.DEFAULT}
            disabled={!unreadCount}
            isLoading={isPending}
            onClick={() => markRead({ all: true })}
          >
            Mark all as read
          </Button>
        )}
      </header>
      {isAuth ? (
        <>
          <Tabs
            theme="segmented"
            ariaLabel="Show notifications"
            defaultTabIndex={tabIndex}
            isUseDefaultIndex
            contents={[
              { tabName: "All", onTabClick: () => setTabIndex(ALL_TAB) },
              {
                tabName: "Unread",
                count: unreadCount,
                onTabClick: () => setTabIndex(UNREAD_TAB),
              },
            ]}
          />
          <NotificationsFeed isUnread={tabIndex === UNREAD_TAB} isPaged />
        </>
      ) : (
        <EmptyState
          variant="compact"
          isWithoutImage
          title="Log in to see your notifications."
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
