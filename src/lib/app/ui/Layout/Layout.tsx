import { FC, ReactNode } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { useWindowResizeAction } from "@/src/lib/shared/hooks";
import { useAppDispatch } from "../../store";
import { setIsMobile } from "../../store/slices/commonSlice";
import { screenMd } from "@/src/lib/shared/constants";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();

  useWindowResizeAction(() => {
    dispatch(setIsMobile(window.innerWidth <= screenMd));
  });

  return (
    <div className={styles.layout}>
      <Header />
      {children}
    </div>
  );
};
