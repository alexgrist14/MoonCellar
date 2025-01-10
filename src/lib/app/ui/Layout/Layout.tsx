import { authAPI, userAPI } from "@/src/lib/shared/api";
import { screenSm } from "@/src/lib/shared/constants";
import { useWindowResizeAction } from "@/src/lib/shared/hooks";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { FC, ReactNode, useEffect, useState } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { useResizeDetector } from "react-resize-detector";
import { Shadow } from "@/src/lib/shared/ui/Shadow";

interface ILayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout: FC<ILayoutProps> = ({ children, className }) => {
  const { getById } = userAPI;
  const { refreshToken } = authAPI;
  const { setAuth, setProfile, clear, isAuth } = useAuthStore();
  const { setMobile, isMobile } = useStatesStore();

  const [isShadowActive, setIsShadowActive] = useState(false);

  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  useEffect(() => {
    if (isAuth) {
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
    }
  }, [clear, getById, isAuth, refreshToken, setAuth, setProfile]);

  useWindowResizeAction(() => {
    setMobile(window.innerWidth <= screenSm);
  });

  return (
    <div className={className}>
      <Header />
      {isMobile ? (
        <main className={"container"} ref={ref}>
          {children}
          <Shadow isActive={isShadowActive} isFixed />
        </main>
      ) : (
        <Scrollbar
          stl={styles}
          type="absolute"
          onScrollBottom={(isBottom) => {
            if (isBottom !== isShadowActive) {
              setIsShadowActive(isBottom);
            }
          }}
        >
          <main className={"container"} ref={ref}>
            {children}
            <Shadow isActive={isShadowActive} isFixed />
          </main>
        </Scrollbar>
      )}
    </div>
  );
};
