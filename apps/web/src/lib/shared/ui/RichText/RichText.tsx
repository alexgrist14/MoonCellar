import { FC } from "react";
import { Interweave } from "interweave";
import classNames from "classnames";
import styles from "./RichText.module.scss";

interface IRichTextProps {
  content?: string;
  className?: string;
  tone?: "primary" | "secondary";
  size?: "default" | "article";
}

export const RichText: FC<IRichTextProps> = ({
  content,
  className,
  tone = "secondary",
  size = "default",
}) => {
  if (!content) return null;

  return (
    <div
      className={classNames(styles.richText, className, {
        [styles.richText_primary]: tone === "primary",
        [styles.richText_article]: size === "article",
      })}
    >
      <Interweave content={content} />
    </div>
  );
};
