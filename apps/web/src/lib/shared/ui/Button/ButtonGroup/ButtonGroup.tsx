import { CSSProperties, FC } from "react";
import { Button } from "../Button";
import styles from "./ButtonGroup.module.scss";
import classNames from "classnames";
import { IButtonGroupItem } from "@/src/lib/shared/types/buttons.type";

interface IButtonGroupProps {
  buttons: IButtonGroupItem[];
  wrapperStyle?: CSSProperties;
  wrapperClassName?: string;
}

export const ButtonGroup: FC<IButtonGroupProps> = ({
  buttons,
  wrapperStyle,
  wrapperClassName,
}) => {
  return (
    <div
      style={wrapperStyle}
      className={classNames(styles.group, wrapperClassName)}
    >
      {buttons.map(({ title, link, ...data }, i) => (
        <Button key={i} {...data} href={link || data.href}>
          {title}
        </Button>
      ))}
    </div>
  );
};
