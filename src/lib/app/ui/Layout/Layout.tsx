"use client";

import { FC, ReactNode, useEffect, useRef } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { useResizeDetector } from "react-resize-detector";
import { ModalsConnector } from "@/src/lib/shared/ui/Modal";
import { ToastConnector } from "@/src/lib/shared/ui/Toast";
import { useMediaStore } from "@/src/lib/shared/hooks/useMediaStore";
import { useAuthRefresh } from "@/src/lib/shared/hooks/useAuthRefresh";
import { useGetUserInfo } from "@/src/lib/features/user/model/user.hooks";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { gamesApi, userAPI } from "@/src/lib/shared/api";
import { platformsAPI } from "@/src/lib/shared/api/platforms.api";
import { ErrorHandler } from "@/src/lib/shared/ui/ErrorHandler";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useGameFiltersQuery } from "@/src/lib/entities/game/api/game.queries";
import {
  PAGE_SCROLL_ID,
  scrollPageToTop,
} from "@/src/lib/shared/utils/common.utils";
import { usePlatformsQuery } from "@/src/lib/entities/platform/api/platform.queries";

interface ILayoutProps {
  children: ReactNode;
  className?: string;
}

const LAST_ONLINE_UPDATE_INTERVAL = 5 * 60 * 1000;

const TOP_MENU_ROUTES = ["/games", "/gauntlet"];
const BOTTOM_BAR_ROUTES = ["/games", "/gauntlet"];
const BOTTOM_BAR_PREFIXES = ["/user/"];

const hasTopMenu = (pathname: string) => TOP_MENU_ROUTES.includes(pathname);

const hasBottomBar = (pathname: string) =>
  BOTTOM_BAR_ROUTES.includes(pathname) ||
  BOTTOM_BAR_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export const Layout: FC<ILayoutProps> = ({ children, className }) => {
  const {
    setGenres,
    setGameModes,
    setSystems,
    setThemes,
    setGameTypes,
    setCompanies,
    setKeywords,
    setFranchises,
    setGameEngines,
    setPlayerPerspectives,
    setLanguages,
    setStatuses,
    setAgeRatings,
  } = useCommonStore();
  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });
  const pathname = usePathname();
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const profile = useAuthStore((state) => state.profile);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    scrollPageToTop();
  }, [pathname]);

  useAuthRefresh();
  useMediaStore();
  useGetUserInfo();

  useEffect(() => {
    if (!profile?._id) return;

    const now = Date.now();
    if (now - lastUpdateRef.current > LAST_ONLINE_UPDATE_INTERVAL) {
      lastUpdateRef.current = now;
      userAPI.updateUserTime(profile._id);
    }
  }, [pathname, profile?._id]);

  const { data: filters } = useGameFiltersQuery();
  const { data: platforms } = usePlatformsQuery();

  useEffect(() => {
    if (!filters) return;

    setGenres(filters.genres ?? []);
    setGameModes(filters.modes ?? []);
    setThemes(filters.themes ?? []);
    setGameTypes(filters.type ?? []);
    setCompanies(filters.companies ?? []);
    setKeywords(filters.keywords ?? []);
    setFranchises(filters.franchises ?? []);
    setGameEngines(filters.game_engines ?? []);
    setPlayerPerspectives(filters.player_perspectives ?? []);
    setLanguages(filters.languages ?? []);
    setStatuses(filters.status ?? []);
    setAgeRatings(filters.ageRatings ?? []);
  }, [
    setGenres,
    setGameModes,
    setSystems,
    setThemes,
    setGameTypes,
    setCompanies,
    setKeywords,
    setFranchises,
    setGameEngines,
    setPlayerPerspectives,
    setLanguages,
    setStatuses,
    setAgeRatings,
    filters,
  ]);

  useEffect(() => {
    if (!platforms) return;
    setSystems(platforms);
  }, [platforms, setSystems]);

  return (
    <div className={classNames(className, styles.layout)}>
      <ErrorHandler />
      <Header />
      <Scrollbar
        id={PAGE_SCROLL_ID}
        initialContentRef={scrollContentRef}
        classNameContent={styles.scrollbars__content}
        classNameScrollbar={styles.scrollbars__scrollbar}
        type="absolute"
      >
        <main
          className={classNames("container", {
            container_topMenu: hasTopMenu(pathname),
            container_bottomBar: hasBottomBar(pathname),
          })}
          ref={ref}
        >
          {children}
        </main>
      </Scrollbar>
      <ToastConnector />
      <ModalsConnector />
      <div id="expand-connector"></div>
      <div id="pagination-connector"></div>
      <div id="tooltip-connector"></div>
      <div id="dropdown-connector"></div>
    </div>
  );
};
