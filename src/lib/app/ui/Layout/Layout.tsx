"use client";

import { FC, ReactNode, Suspense, useEffect } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { useResizeDetector } from "react-resize-detector";
import { ModalsConnector } from "@/src/lib/shared/ui/Modal";
import { ToastConnector } from "@/src/lib/shared/ui/Toast";
import { useMediaStore } from "@/src/lib/shared/hooks/useMediaStore";
import { CheckMobile } from "@/src/lib/shared/ui/CheckMobile";
import { useAuthRefresh } from "@/src/lib/shared/hooks/useAuthRefresh";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { useGetUserInfo } from "@/src/lib/features/user/model/user.hooks";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { gamesApi } from "@/src/lib/shared/api";
import { platformsAPI } from "@/src/lib/shared/api/platforms.api";
import { YandexMetrikaContainer } from "@/src/lib/shared/ui/YandexMetrika";
import classNames from "classnames";

interface ILayoutProps {
  children: ReactNode;
  className?: string;
  accessToken?: RequestCookie;
  refreshToken?: RequestCookie;
}

export const Layout: FC<ILayoutProps> = ({
  children,
  className,
  refreshToken,
  accessToken,
}) => {
  const {
    setGenres,
    setGameModes,
    setSystems,
    setThemes,
    setGameTypes,
    setCompanies,
    setKeywords,
  } = useCommonStore();
  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  useAuthRefresh({ accessToken, refreshToken });
  useMediaStore();
  useGetUserInfo();

  useEffect(() => {
    gamesApi.getFilters().then((response) => {
      if (!response) return;

      const { genres, modes, keywords, companies, themes, type } = response;

      setGenres(genres);
      setGameModes(modes);
      setThemes(themes);
      setGameTypes(type);
      setCompanies(companies);
      setKeywords(keywords);
    });

    platformsAPI.getAll().then((res) => {
      setSystems(res.data);
    });
  }, [
    setGenres,
    setGameModes,
    setSystems,
    setThemes,
    setGameTypes,
    setCompanies,
    setKeywords,
  ]);

  return (
    <div className={classNames(className, styles.layout)}>
      <CheckMobile>
        <Header />
      </CheckMobile>
      <Scrollbar
        classNameContent={styles.scrollbars__content}
        classNameScrollbar={styles.scrollbars__scrollbar}
        type="absolute"
        fadeType="bottom"
      >
        <main className={"container"} ref={ref}>
          {children}
        </main>
      </Scrollbar>
      <ToastConnector />
      <ModalsConnector />
      <div id="expand-connector"></div>
      <div id="pagination-connector"></div>
      <div id="tooltip-connector"></div>
      <Suspense fallback="<></>">
        <YandexMetrikaContainer />
      </Suspense>
    </div>
  );
};
