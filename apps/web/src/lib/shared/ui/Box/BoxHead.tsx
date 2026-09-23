import { FC, ReactNode, Ref } from "react";
import classNames from "classnames";
import styles from "./Box.module.scss";
import { Button, ButtonColor } from "../Button";
import { SvgClose } from "../svg";

interface IBoxHeadProps {
  title?: string;
  titleAction?: ReactNode;
  isHeaderWithoutStyles?: boolean;
  isVerticalActions?: boolean;
  isTitleStart?: boolean;
  isExternal?: boolean;
  onClose?: () => void;
  closeButtonRef?: Ref<HTMLButtonElement>;
}

export const BoxHead: FC<IBoxHeadProps> = ({
  isHeaderWithoutStyles,
  isVerticalActions,
  title,
  titleAction,
  isTitleStart,
  isExternal,
  onClose,
  closeButtonRef,
}) => {
  if (
    !title ||
    (isExternal && !isHeaderWithoutStyles) ||
    (!isExternal && isHeaderWithoutStyles)
  )
    return null;

  const action = onClose ? (
    <div className={styles.template__actions}>
      {titleAction}
      <Button
        ref={closeButtonRef}
        color={ButtonColor.TRANSPARENT}
        className={styles.template__close}
        tooltip="Close"
        onClick={onClose}
      >
        <SvgClose size="16" />
      </Button>
    </div>
  ) : (
    titleAction
  );

  return (
    <div
      className={
        !!action && !isExternal ? styles.template__head_action : undefined
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
      {action}
    </div>
  );
};
