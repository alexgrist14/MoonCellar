import { FC, ReactNode, useState } from "react";
import classNames from "classnames";
import styles from "./Spoiler.module.scss";
import { SvgEye } from "../svg";

interface ISpoilerProps {
  children: ReactNode;
  isActive?: boolean;
  className?: string;
  label?: string;
  hideLabel?: string;
}

export const Spoiler: FC<ISpoilerProps> = ({
  children,
  isActive = true,
  className,
  label = "Show spoilers",
  hideLabel = "Hide spoilers",
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const isHidden = isActive && !isRevealed;

  return (
    <div
      className={classNames(
        styles.spoiler,
        { [styles.spoiler_hidden]: isHidden },
        className
      )}
    >
      <div className={styles.spoiler__content} inert={isHidden}>
        {children}
      </div>
      {isHidden && (
        <button
          type="button"
          className={styles.spoiler__button}
          onClick={() => setIsRevealed(true)}
        >
          <SvgEye size="16" color="attention" />
          {label}
        </button>
      )}
      {isActive && isRevealed && (
        <button
          type="button"
          className={classNames(
            styles.spoiler__button,
            styles.spoiler__button_hide
          )}
          onClick={() => setIsRevealed(false)}
        >
          <SvgEye size="16" color="attention" />
          {hideLabel}
        </button>
      )}
    </div>
  );
};
