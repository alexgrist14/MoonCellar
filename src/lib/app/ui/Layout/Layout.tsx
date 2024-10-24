import { FC, ReactNode } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { useWindowResizeAction } from "@/src/lib/shared/hooks";
import { screenMd } from "@/src/lib/shared/constants";
import { useCommonStore } from "@/src/lib/shared/store/common.store";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  const { setIsMobile } = useCommonStore();

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
