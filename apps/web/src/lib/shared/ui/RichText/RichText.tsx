import { FC } from "react";
import { Interweave } from "interweave";
import classNames from "classnames";
import styles from "./RichText.module.scss";

interface IRichTextProps {
  content?: string;
  className?: string;
}

export const RichText: FC<IRichTextProps> = ({ content, className }) => {
  if (!content) return null;

  return (
    <div className={classNames(styles.richText, className)}>
      <Interweave content={content} />
    </div>
  );
};
