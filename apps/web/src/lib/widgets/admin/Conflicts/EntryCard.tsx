import { FC, useEffect, useRef } from "react";
import classNames from "classnames";
import { IConflictEntry } from "@mooncellar/schemas";
import { Fact } from "./CandidateCard";
import styles from "./Conflicts.module.scss";

interface IEntryCardProps {
  entry: IConflictEntry;
  isSelected: boolean;
  onSelect: () => void;
}

export const EntryCard: FC<IEntryCardProps> = ({
  entry,
  isSelected,
  onSelect,
}) => {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isSelected) ref.current?.scrollIntoView({ block: "nearest" });
  }, [isSelected]);

  return (
    <li
      ref={ref}
      aria-current={isSelected}
      className={classNames(styles.candidate, {
        [styles.candidate_selected]: isSelected,
      })}
      onClick={onSelect}
    >
      <div className={styles.candidate__body}>
        <div className={styles.candidate__head}>
          {entry.url ? (
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
              className={styles.candidate__name}
              onClick={(event) => event.stopPropagation()}
            >
              {entry.name}
            </a>
          ) : (
            <span className={styles.candidate__name}>{entry.name}</span>
          )}
        </div>

        <dl className={styles.facts}>
          <Fact
            label="Released"
            value={entry.releaseYear ? String(entry.releaseYear) : null}
          />
          <Fact label="Platforms" value={entry.platforms.join(", ")} />
        </dl>

        {!!entry.details.length && (
          <ul className={styles.ledger} aria-label="Entry facts">
            {entry.details.map((detail) => (
              <li key={detail} className={styles.chip}>
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.candidate__side}>
        {entry.score != null && (
          <span className={styles.score}>
            {Math.round(entry.score * 100) / 100}
            <small>similarity</small>
          </span>
        )}
      </div>
    </li>
  );
};
