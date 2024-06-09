import { FC } from "react";
import styles from "./Header.module.scss";
import Link from "next/link";
import { Input } from "@/src/lib/shared/ui/Input";

export const Header: FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.container__left}>
        <Link href="/" className={styles.title}>
          MoonCellar
        </Link>
        <Input
          defaultValue={""}
          onChange={() => {}}
          placeholder="Search game..."
        />
      </div>
      <div className={styles.container__right}>
        <Link href="/auth/signup" className={styles.link}>
          SingUp
        </Link>
        <Link href="/auth/login" className={styles.link}>
          Login
        </Link>
        <Link href="/users" className={styles.link}>
          Profile
        </Link>
      </div>
    </div>
  );
};

