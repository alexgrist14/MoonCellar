import { FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./Box.module.scss";

interface IBoxHeadProps {
  title?: string;
  titleAction?: ReactNode;
  isHeaderWithoutStyles?: boolean;
  isVerticalActions?: boolean;
  isTitleStart?: boolean;
  isExternal?: boolean;
}

export const BoxHead: FC<IBoxHeadProps> = ({
  isHeaderWithoutStyles,
  isVerticalActions,
  title,
  titleAction,
  isTitleStart,
  isExternal,
}) => {
  if (
    !title ||
    (isExternal && !isHeaderWithoutStyles) ||
    (!isExternal && isHeaderWithoutStyles)
  )
    return null;
  return (
    <div
      className={
        !!titleAction && !isExternal ? styles.template__head_action : undefined
      }
    >
      <h2
        className={classNames(styles.template__title, {
          [styles.template__title_vertical]: isVerticalActions,
          [styles.template__title_start]: isTitleStart,
          [styles.template__title_external]: isExternal,
        })}
      >
        {title}
      </h2>
      {!!titleAction && titleAction}
    </div>
  );
};
