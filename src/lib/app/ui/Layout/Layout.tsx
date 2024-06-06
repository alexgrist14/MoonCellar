import { FC, ReactNode } from "react";
import styles from "./Layout.module.scss";
import { Footer } from "./components/Footer/Footer";
import Header from "./components/Header/Header";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header/>
      {children}
      {/* <Footer /> */}
    </div>
  );
};
