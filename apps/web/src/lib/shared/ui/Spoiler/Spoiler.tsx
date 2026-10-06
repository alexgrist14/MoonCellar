import { FC, ReactNode, useEffect, useState } from "react";
import classNames from "classnames";
import styles from "./Spoiler.module.scss";
import { SpoilerButton } from "../SpoilerButton";

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
        <SpoilerButton
          className={styles.spoiler__button}
          onClick={() => setIsRevealed(true)}
        >
          {label}
        </SpoilerButton>
      )}
      {isActive && isRevealed && (
        <SpoilerButton
          className={classNames(
            styles.spoiler__button,
            styles.spoiler__button_hide
          )}
          onClick={() => setIsRevealed(false)}
        >
          {hideLabel}
        </SpoilerButton>
      )}
    </div>
  );
};
