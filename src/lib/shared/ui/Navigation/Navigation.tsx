import { FC } from "react";
import styles from "./Navigation.module.scss";
import { links } from "../../constants";
import Link from "next/link";
import { Button } from "../Button";
import { useCommonStore } from "../../store/common.store";

export const Navigation: FC = () => {
  const { setExpanded } = useCommonStore();

  return (
    <div className={styles.nav}>
      {links.map((link, i) => (
        <Link
          key={i}
          href={link.link}
          onClick={() => {
            setExpanded("none");
          }}
        >
          <Button color="default" className={styles.nav__button}>
            {link.name}
          </Button>
        </Link>
      ))}
    </div>
  );
};
