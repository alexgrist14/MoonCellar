import { FC } from "react";
import styles from "./FixedMenu.module.scss";
import { ButtonGroup } from "../Button/ButtonGroup";
import { IButtonGroupItem } from "../../types/buttons.type";

export const FixedMenu: FC<{ buttons: IButtonGroupItem[] }> = ({ buttons }) => {
  return <ButtonGroup wrapperClassName={styles.menu} buttons={buttons} />;
};
