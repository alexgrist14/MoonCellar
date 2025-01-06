import { authAPI, userAPI } from "@/src/lib/shared/api";
import { screenSm } from "@/src/lib/shared/constants";
import { useWindowResizeAction } from "@/src/lib/shared/hooks";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { FC, ReactNode, useEffect } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  const { getById } = userAPI;
  const { refreshToken } = authAPI;
  const { setAuth, setProfile, clear, isAuth } = useAuthStore();
  const { setMobile } = useStatesStore();

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
    <Scrollbar className={styles.layout} stl={styles} type="absolute">
      <Header />
      {children}
    </Scrollbar>
  );
};
