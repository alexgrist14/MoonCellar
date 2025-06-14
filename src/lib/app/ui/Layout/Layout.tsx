"use client";

import { FC, ReactNode } from "react";
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
  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  useAuthRefresh({ accessToken, refreshToken });
  useMediaStore();
  useGetUserInfo();

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
      <div id="mobile-menu-connector"></div>
      <div id="pagination-connector"></div>
      <div id="tooltip-connector"></div>
    </div>
  );
};
