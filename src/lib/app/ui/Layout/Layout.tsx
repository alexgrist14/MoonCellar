import { authAPI, userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { FC, ReactNode, useEffect } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { useResizeDetector } from "react-resize-detector";
import { ModalsConnector } from "@/src/lib/shared/ui/Modal";
import { ToastConnector } from "@/src/lib/shared/ui/Toast";
import { useMediaStore } from "@/src/lib/shared/hooks/useMediaStore";
import { CheckMobile } from "@/src/lib/shared/ui/CheckMobile";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

interface ILayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout: FC<ILayoutProps> = ({ children, className }) => {
  const { getById } = userAPI;
  const { refreshToken } = authAPI;
  const { setAuth, setProfile, clear, isAuth } = useAuthStore();
  const { isMobile } = useStatesStore();

  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  useMediaStore();

  useEffect(() => {
    refreshToken()
      .then((res) => {
        setAuth(true);
        getById(res.data.userId).then((res) => {
          setProfile(res.data);
        });
      })
      .catch(() => {
        clear();
      });
  }, [clear, getById, isAuth, refreshToken, setAuth, setProfile]);

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
    </div>
  );
};
