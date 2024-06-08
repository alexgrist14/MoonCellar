import { FC, ReactNode } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      {children}
    </div>
  );
};
