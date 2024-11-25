import { FC, ReactNode, useEffect } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { useWindowResizeAction } from "@/src/lib/shared/hooks";
import { links, REFRESH_TOKEN, screenMd } from "@/src/lib/shared/constants";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { Navigation } from "@/src/lib/shared/ui/Navigation";
import { getCookie } from "@/src/lib/shared/utils/cookies";
import { jwtDecode } from "jwt-decode";
import { isTokenExpired } from "@/src/lib/shared/utils/token";
import { userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  const { setIsMobile } = useCommonStore();
  const { getById } = userAPI;

  const { setAuth, setProfile, clear } = useAuthStore();

  useEffect(() => {
    const token = getCookie(REFRESH_TOKEN);
    if (token) {
      const decoded: any = jwtDecode(token);
      if (decoded.exp) {
        setAuth(!isTokenExpired(decoded.exp));
        getById(decoded.id).then((res) => {
          setProfile(res.data);
        });
      }
    } else {
      clear();
    }
  }, [clear, getById, setAuth, setProfile]);

  useWindowResizeAction(() => {
    setIsMobile(window.innerWidth <= screenMd);
  });

  return (
    <div className={styles.layout}>
      <Header />
      {children}
      <ExpandMenu position="right" titleOpen="Navigation">
        <Navigation />
      </ExpandMenu>
    </div>
  );
};
