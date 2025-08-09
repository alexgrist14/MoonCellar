"use client";

import { FC, ReactNode, useEffect } from "react";
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
import { IGDBApi } from "@/src/lib/shared/api";
import { useCommonStore } from "@/src/lib/shared/store/common.store";

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
  const { setGenres, setGameModes, setSystems, setThemes, setGameTypes } =
    useCommonStore();
  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  useAuthRefresh({ accessToken, refreshToken });
  useMediaStore();
  //useGetUserInfo();

  // useEffect(() => {
  //   IGDBApi.getGenres().then((response) => setGenres(response.data));
  //   IGDBApi.getModes().then((response) => setGameModes(response.data));
  //   IGDBApi.getPlatforms().then((response) => setSystems(response.data));
  //   IGDBApi.getThemes().then((response) => setThemes(response.data));
  //   IGDBApi.getGameTypes().then((response) => setGameTypes(response.data));
  // }, [setGenres, setGameModes, setSystems, setThemes, setGameTypes]);

  return (
    <div className={className}>
      <CheckMobile>
        <Header />
      </CheckMobile>
      <Scrollbar stl={styles} type="absolute" fadeType="bottom">
        <main className={"container"} ref={ref}>
          {children}
        </main>
      </Scrollbar>
      <ToastConnector />
      <ModalsConnector />
      <div id="expand-connector"></div>
      <div id="pagination-connector"></div>
      <div id="tooltip-connector"></div>
    </div>
  );
};
