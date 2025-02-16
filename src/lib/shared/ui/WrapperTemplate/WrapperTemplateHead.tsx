import { FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./WrapperTemplate.module.scss";

interface IWrapperTemplateHeadProps {
  title?: string;
  titleAction?: ReactNode;
  isHeaderWithoutStyles?: boolean;
  isVerticalActions?: boolean;
  isExternal?: boolean;
}

export const WrapperTemplateHead: FC<IWrapperTemplateHeadProps> = ({
  isHeaderWithoutStyles,
  isVerticalActions,
  title,
  titleAction,
  isExternal,
}) => {
  if (
    !title ||
    (isExternal && !isHeaderWithoutStyles) ||
    (!isExternal && isHeaderWithoutStyles)
  )
    return null;
  return (
    <div>
      <h2
        className={classNames(styles.template__title, {
          [styles.template__title_vertical]: isVerticalActions,
          [styles.template__title_external]: isExternal,
        })}
      >
        {title}
      </h2>
      {!!titleAction && titleAction}
    </div>
  );
};
