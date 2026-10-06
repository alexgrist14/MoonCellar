import { FC } from "react";
import { Interweave } from "interweave";
import classNames from "classnames";
import styles from "./RichText.module.scss";

interface IRichTextProps {
  content?: string;
  className?: string;
  tone?: "primary" | "secondary";
}

export const RichText: FC<IRichTextProps> = ({
  content,
  className,
  tone = "secondary",
}) => {
  if (!content) return null;

  return (
    <div
      className={classNames(styles.richText, className, {
        [styles.richText_primary]: tone === "primary",
      })}
    >
      <Interweave content={content} />
    </div>
  );
};
