import { FC } from "react";
import styles from "./Footer.module.scss";

export const Footer: FC = () => {
  return (
    <div className={styles.footer}>
      <div className={styles.developers}>
        <h4>Developers:</h4>
        <a
          className={styles.link}
          href="https://github.com/alexgrist14"
          target="_blank"
          rel="noreferrer"
        >
          <img className={styles.img} src="/images/alexgrist.png" alt="avatar" />
        </a>
        <a
          className={styles.link}
          href="https://github.com/sergeyhist"
          target="_blank"
          rel="noreferrer"
        >
          <img
            className={styles.img}
            src="/images/clown.png"
            alt="avatar"
          />
        </a>
      </div>
      <a
        className={styles.rep}
        target="_blank"
        href="https://github.com/alexgrist14/RetroAchievements-Gauntlet"
        rel="noreferrer"
      >
        <img className={styles.logo} src="/images/github-logo.png" alt="icon" />
      </a>
    </div>
  );
};
