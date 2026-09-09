import { CSSProperties, FC } from "react";
import { Button } from "../Button";
import styles from "./ButtonGroup.module.scss";
import Link from "next/link";
import classNames from "classnames";
import { IButtonGroupItem } from "../../../types/buttons.type";

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
      {buttons.map((button, i) => {
        const { title, link, target, ...data } = button;
        return !!link ? (
          <Link key={i} href={link} target={target}>
            <Button {...data}>{title}</Button>
          </Link>
        ) : (
          <Button key={i} {...data}>
            {title}
          </Button>
        );
      })}
    </div>
  );
};
