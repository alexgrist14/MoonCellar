import { FC, ReactNode } from "react";
import styles from "@/src/lib/features/game/ui/GameCommunity/GameCommunity.module.scss";

interface ICommentQuoteProps {
  label: ReactNode;
  text?: string;
  action?: ReactNode;
}

export const CommentQuote: FC<ICommentQuoteProps> = ({
  label,
  text,
  action,
}) => (
  <div className={styles.quote}>
    <div className={styles.quote__head}>
      <span className={styles.quote__label}>{label}</span>
      {action}
    </div>
    {!!text && <p className={styles.quote__text}>{text}</p>}
  </div>
);
