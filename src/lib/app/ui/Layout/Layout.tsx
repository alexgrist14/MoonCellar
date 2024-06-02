import { FC, ReactNode } from "react";
import styles from "./Layout.module.scss";
import { Footer } from "./components/Footer/Footer";

interface ILayoutProps {
  children: ReactNode;
}

export const Layout: FC<ILayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      {children}
      <Footer />
    </div>
  );
};
