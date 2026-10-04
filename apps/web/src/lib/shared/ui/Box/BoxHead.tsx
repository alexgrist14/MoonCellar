import { CSSProperties, FC, ReactNode, Ref } from "react";
import classNames from "classnames";
import styles from "./Box.module.scss";
import { Button, ButtonColor } from "../Button";
import { SvgClose } from "../svg";

interface IBoxHeadProps {
  title?: ReactNode;
  titleCount?: number;
  titleAction?: ReactNode;
  isHeaderWithoutStyles?: boolean;
  isVerticalActions?: boolean;
  isTitleStart?: boolean;
  isExternal?: boolean;
  onClose?: () => void;
  closeButtonRef?: Ref<HTMLButtonElement>;
  headStyle?: CSSProperties;
}

export const BoxHead: FC<IBoxHeadProps> = ({
  isHeaderWithoutStyles,
  isVerticalActions,
  title,
  titleCount,
  titleAction,
  isTitleStart,
  isExternal,
  onClose,
  closeButtonRef,
  headStyle,
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
        isOnlyIcon
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

  const isHeadPadded = !!action && !isExternal;

  return (
    <div
      className={isHeadPadded ? styles.template__head_action : undefined}
      style={isHeadPadded ? headStyle : undefined}
    >
      <h2
        style={isHeadPadded || isExternal ? undefined : headStyle}
        className={classNames(styles.template__title, {
          [styles.template__title_vertical]: isVerticalActions,
          [styles.template__title_start]: isTitleStart,
          [styles.template__title_external]: isExternal,
        })}
      >
        {typeof titleCount === "number" ? (
          <span>
            {title}
            <span className={styles.template__count}>({titleCount})</span>
          </span>
        ) : (
          title
        )}
      </h2>
      {action}
    </div>
  );
};
