import { FC, Fragment } from "react";
import styles from "./Highlight.module.scss";

interface IHighlightProps {
  text: string;
  query?: string;
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const Highlight: FC<IHighlightProps> = ({ text, query }) => {
  const needle = query?.trim();

  if (!needle) return <>{text}</>;

  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === needle.toLowerCase() ? (
          <mark key={i} className={styles.mark}>
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
};
