import { authAPI, userAPI } from "@/src/lib/shared/api";
import { screenMd } from "@/src/lib/shared/constants";
import { useWindowResizeAction } from "@/src/lib/shared/hooks";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { FC, ReactNode, useEffect, useState } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

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
    setMobile(window.innerWidth <= screenMd);
  });

  return (
    <div className={styles.layout}>
      <Header />
      {children}
    </div>
  );
};
