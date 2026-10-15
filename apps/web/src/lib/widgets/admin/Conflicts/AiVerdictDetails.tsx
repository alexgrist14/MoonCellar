import { FC } from "react";
import Link from "next/link";
import { IConflictRow } from "@mooncellar/schemas";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { drawer } from "@/src/lib/shared/ui/Drawer";
import { setAdminQuery } from "@/src/lib/shared/utils/admin-url.utils";
import { Fact } from "./CandidateCard";
import { aiVerdictTone } from "./labels";
import styles from "./Conflicts.module.scss";

const formatTime = (iso: string) => iso.slice(0, 16).replace("T", " ");

interface IAiVerdictDetailsProps {
  row: IConflictRow;
}

export const AiVerdictDetails: FC<IAiVerdictDetailsProps> = ({ row }) => {
  const verdict = row.aiVerdict;

  if (!verdict) return null;

  const picks = row.candidates.filter(({ gameId }) =>
    verdict.gameIds.includes(gameId)
  );

  return (
    <div className={styles.verdictDetails}>
      <div className={styles.verdictDetails__head}>
        <Badge tone={aiVerdictTone(verdict)}>
          {verdict.confidence}
          {verdict.undoneAt && " · undone"}
        </Badge>
        <span className={styles.rowName}>{row.externalName}</span>
      </div>

      {picks.length ? (
        <ul className={styles.verdictDetails__picks}>
          {picks.map(({ gameId, name, slug }) => (
            <li key={gameId}>
              <Link
                className={styles.rowCandidate}
                href={`/games/${slug}`}
                target="_blank"
              >
                {name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.muted}>No candidate is this entry.</p>
      )}

      <p className={styles.description}>{verdict.reason}</p>

      <dl className={styles.facts}>
        <Fact
          label="Candidates"
          value={row.candidates.map(({ name }) => name).join(" · ")}
        />
        <Fact label="Model" value={verdict.model} />
        <Fact label="Judged" value={formatTime(verdict.judgedAt)} />
        <Fact
          label="Undone"
          value={verdict.undoneAt ? formatTime(verdict.undoneAt) : null}
        />
      </dl>

      <Button
        color={ButtonColor.ACCENT}
        onClick={() => {
          drawer.close();
          setAdminQuery({ source: row.source, conflict: row.externalId });
        }}
      >
        Open the conflict
      </Button>
    </div>
  );
};
