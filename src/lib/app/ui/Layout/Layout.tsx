import { authAPI, userAPI } from "@/src/lib/shared/api";
import { screenMd } from "@/src/lib/shared/constants";
import { useWindowResizeAction } from "@/src/lib/shared/hooks";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { Navigation } from "@/src/lib/shared/ui/Navigation";
import { axiosUtils } from "@/src/lib/shared/utils/axios";
import { FC, ReactNode, useEffect, useState } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { AxiosError } from "axios";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  const { setIsMobile } = useCommonStore();
  const { getById } = userAPI;
  const { refreshToken } = authAPI;
  const { setAuth, setProfile, clear, isAuth } = useAuthStore();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuth) {
      refreshToken()
        .then((res) => {
          setAuth(true);
          getById(res.data.userId).then((res) => {
            setProfile(res.data);
            setLoading(false);
          });
        })
        .catch(() => {
          clear();
          setLoading(false);
        });
    }
  }, [clear, getById, isAuth, refreshToken, setAuth, setProfile]);

  useWindowResizeAction(() => {
    setIsMobile(window.innerWidth <= screenMd);
  });

  return (
      <div className={styles.layout}>
        <Header />
        {children}
      </div>
  );
};
