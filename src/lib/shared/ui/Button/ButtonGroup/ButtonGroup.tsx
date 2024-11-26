import { CSSProperties, FC } from "react";
import { Button } from "../Button";
import styles from "./ButtonGroup.module.scss";
import Link from "next/link";
import classNames from "classnames";
import { IButtonGroupItem } from "../../../types/buttons";

interface IButtonGroupProps {
  buttons: IButtonGroupItem[];
  style?: CSSProperties;
  wrapperStyle?: CSSProperties;
  isCompact?: boolean;
  wrapperClassName?: string;
}

export const ButtonGroup: FC<IButtonGroupProps> = ({
  buttons,
  style,
  wrapperStyle,
  isCompact,
  wrapperClassName,
}) => {
  return (
    <div
      style={wrapperStyle}
      className={classNames(styles.group, wrapperClassName, {
        [styles.group_compact]: isCompact,
      })}
    >
      {buttons.map((button, i) =>
        !!button.link ? (
          <Link key={i} href={button.link} target={button.target}>
            <Button
              style={{ ...style, ...(button.isHidden && { display: "none" }) }}
              onClick={button.callback}
              active={button.isActive}
              disabled={button.isDisabled}
              color={button.color}
              className={classNames(styles.group__button, {
                [styles.group__button_compact]: isCompact,
              })}
            >
              {button.title}
            </Button>
          </Link>
        ) : (
          <Button
            key={i}
            style={{ ...style, ...(button.isHidden && { display: "none" }) }}
            onClick={button.callback}
            active={button.isActive}
            disabled={button.isDisabled}
            color={button.color}
            className={classNames(styles.group__button, {
              [styles.group__button_compact]: isCompact,
            })}
          >
            {button.title}
          </Button>
        )
      )}
    </div>
  );
};
