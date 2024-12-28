import { FC, useState } from "react";
import styles from "./FixedMenu.module.scss";
import { ButtonGroup } from "../Button/ButtonGroup";
import { IButtonGroupItem } from "../../types/buttons";
import { useWindowScroll } from "../../hooks/useWindowScroll";

export const FixedMenu: FC<{ buttons: IButtonGroupItem[] }> = ({ buttons }) => {
  const [top, setTop] = useState("55px");

  useWindowScroll(() => {
    setTop(window.scrollY > 55 ? "0px" : 55 - window.scrollY + "px");
  });

  return (
    <ButtonGroup
      wrapperStyle={{ top }}
      wrapperClassName={styles.menu}
      buttons={buttons}
    />
  );
};
