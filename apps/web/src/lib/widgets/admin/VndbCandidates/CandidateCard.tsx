import { FC, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";
import {
  IVndbReviewCandidate,
  IVndbScoreBreakdown,
} from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import styles from "./VndbCandidates.module.scss";

const BREAKDOWN_LABELS: Record<keyof IVndbScoreBreakdown, string> = {
  title: "Title",
  companies: "Companies",
  date: "Release date",
  platforms: "Platforms",
  genre: "Genre",
  type: "Type",
};

const SIGNALS: {
  label: string;
  isPositive: boolean;
  isShown: (candidate: IVndbReviewCandidate) => boolean;
}[] = [
  {
    label: "Dates agree",
    isPositive: true,
    isShown: ({ dateSignal }) => dateSignal === "confirms",
  },
  {
    label: "Dates contradict",
    isPositive: false,
    isShown: ({ dateSignal }) => dateSignal === "contradicts",
  },
  {
    label: "Descriptions overlap",
    isPositive: true,
    isShown: ({ descriptionSignal }) => descriptionSignal === "match",
  },
  {
    label: "Descriptions differ",
    isPositive: false,
    isShown: ({ descriptionSignal }) => descriptionSignal === "mismatch",
  },
  {
    label: "Different companies",
    isPositive: false,
    isShown: ({ hasCompanyMismatch }) => hasCompanyMismatch,
  },
];

const formatPoints = (value: number) =>
  value > 0 ? `+${value}` : `−${Math.abs(value)}`;

const formatUnixDate = (seconds: number) =>
  new Date(seconds * 1000).toISOString().slice(0, 10);

export const Fact: FC<{ label: string; value?: string | null }> = ({
  label,
  value,
}) =>
  value ? (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  ) : null;

interface ICandidateCardProps {
  candidate: IVndbReviewCandidate;
  isSelected: boolean;
  isMatchShown: boolean;
  platformNames: (ids: string[]) => string;
  onSelect: () => void;
  onMatch: () => void;
}

export const CandidateCard: FC<ICandidateCardProps> = ({
  candidate,
  isSelected,
  isMatchShown,
  platformNames,
  onSelect,
  onMatch,
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const { game, breakdown } = candidate;
  const points = (
    Object.keys(BREAKDOWN_LABELS) as (keyof IVndbScoreBreakdown)[]
  ).filter((key) => breakdown[key]);

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
      <div className={styles.candidate__cover}>
        {game?.cover && (
          <Image src={game.cover} width={64} height={88} alt={candidate.name} />
        )}
      </div>

      <div className={styles.candidate__body}>
        <div className={styles.candidate__head}>
          <Link
            href={`/games/${candidate.slug}`}
            target="_blank"
            className={styles.candidate__name}
            onClick={(event) => event.stopPropagation()}
          >
            {candidate.name}
          </Link>
          {game?.type && <span className={styles.badge}>{game.type}</span>}
          {game?.linkedVnId && (
            <span className={classNames(styles.badge, styles.badge_attention)}>
              Linked to {game.linkedVnId}
            </span>
          )}
          {!game && (
            <span className={classNames(styles.badge, styles.badge_attention)}>
              Deleted from the catalogue
            </span>
          )}
        </div>

        {game && (
          <dl className={styles.facts}>
            <Fact
              label="Released"
              value={game.firstRelease ? formatUnixDate(game.firstRelease) : null}
            />
            <Fact
              label="Companies"
              value={game.companies.map(({ name }) => name).join(", ")}
            />
            <Fact label="Platforms" value={platformNames(game.platformIds)} />
            <Fact
              label="Also known as"
              value={game.alternativeNames.join(" · ")}
            />
          </dl>
        )}

        {game?.summary && <p className={styles.summary}>{game.summary}</p>}

        <ul className={styles.ledger} aria-label="Why the score">
          {points.map((key) => (
            <li
              key={key}
              className={classNames(
                styles.chip,
                breakdown[key] > 0 ? styles.chip_positive : styles.chip_negative
              )}
            >
              {BREAKDOWN_LABELS[key]} {formatPoints(breakdown[key])}
            </li>
          ))}
          {SIGNALS.filter(({ isShown }) => isShown(candidate)).map(
            ({ label, isPositive }) => (
              <li
                key={label}
                className={classNames(styles.chip, styles.chip_signal, {
                  [styles.chip_positive]: isPositive,
                  [styles.chip_negative]: !isPositive,
                })}
              >
                {label}
              </li>
            )
          )}
        </ul>
      </div>

      <div className={styles.candidate__side}>
        <span className={styles.score}>
          {candidate.score}
          <small>score</small>
        </span>
        {isMatchShown && (
          <Button
            color={ButtonColor.GREEN}
            className={styles.matchButton}
            disabled={!game}
            onClick={(event) => {
              event.stopPropagation();
              onMatch();
            }}
          >
            Match
          </Button>
        )}
      </div>
    </li>
  );
};
