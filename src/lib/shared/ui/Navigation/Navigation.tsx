import { FC } from "react";
import styles from "./Navigation.module.scss";
import { links } from "../../constants";
import { useCommonStore } from "../../store/common.store";
import { ButtonGroup } from "../Button/ButtonGroup";

export const Navigation: FC = () => {
  const { setExpanded } = useCommonStore();

  return (
    <ButtonGroup
      wrapperClassName={styles.nav}
      buttons={links.map((link) => ({
        title: link.name,
        link: link.link,
        onClick: () => setExpanded([]),
      }))}
    />
  );
};
