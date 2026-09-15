import { FC, ReactNode, useState } from "react";
import classNames from "classnames";
import styles from "./Spoiler.module.scss";
import { SvgEye } from "../svg";

interface ISpoilerProps {
  children: ReactNode;
  isActive?: boolean;
  className?: string;
}

export const Spoiler: FC<ISpoilerProps> = ({
  children,
  isActive = true,
  className,
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
      <div className={styles.spoiler__content} aria-hidden={isHidden}>
        {children}
      </div>
      {isHidden && (
        <button
          type="button"
          className={styles.spoiler__button}
          onClick={() => setIsRevealed(true)}
        >
          <SvgEye size="16" color="attention" />
          Show spoilers
        </button>
      )}
    </div>
  );
};
