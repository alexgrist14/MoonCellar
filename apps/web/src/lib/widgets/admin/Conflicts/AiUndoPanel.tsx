import { FC, useState } from "react";
import Link from "next/link";
import { IConflictAiMatch, IConflictSource } from "@mooncellar/schemas";
import { useConflictAiMatchesQuery } from "@/src/lib/entities/conflict/api";
import { adminConflictsApi } from "@/src/lib/shared/api";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { drawer } from "@/src/lib/shared/ui/Drawer";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { AI_CONFIDENCE_TONES, SOURCE_LABELS } from "./labels";
import styles from "./Conflicts.module.scss";

const LATEST_COUNT = 10;

const keyOf = ({ source, externalId }: IConflictAiMatch) =>
  `${source}:${externalId}`;

interface IAiUndoPanelProps {
  source?: IConflictSource;
  onStarted: () => void;
}

export const AiUndoPanel: FC<IAiUndoPanelProps> = ({ source, onStarted }) => {
  const { data: matches = [], isLoading } = useConflictAiMatchesQuery(source);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, setIsPending] = useState(false);
  const picked = matches.filter((match) => selected.has(keyOf(match)));

  const select = (list: IConflictAiMatch[]) =>
    setSelected(new Set(list.map(keyOf)));

  const toggle = (match: IConflictAiMatch) =>
    setSelected((current) => {
      const next = new Set(current);
      const key = keyOf(match);

      if (!next.delete(key)) next.add(key);

      return next;
    });

  const undo = () => {
    setIsPending(true);
    adminConflictsApi
      .undoAiDecisions(
        source,
        picked.map(({ source: from, externalId }) => ({
          source: from,
          externalId,
        }))
      )
      .then(({ data }) => {
        toast.success({ description: data.message });
        drawer.close();
        onStarted();
      })
      .catch(() => undefined)
      .finally(() => setIsPending(false));
  };

  if (isLoading) {
    return (
      <div className={styles.undoPanel} role="status" aria-label="Loading">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} height="var(--gap-x6)" />
        ))}
      </div>
    );
  }

  if (!matches.length) {
    return <EmptyState variant="inline" title="No AI match can be undone." />;
  }

  return (
    <div className={styles.undoPanel}>
      <p className={styles.muted}>
        Undo unlinks the games and puts the conflict back in the queue. A field
        the match filled is cleared only if nobody changed it since; matches
        made by hand are never listed here.
      </p>

      <div className={styles.undoPanel__toolbar}>
        <Button compact onClick={() => select(matches)}>
          All ({matches.length})
        </Button>
        <Button compact onClick={() => select(matches.slice(0, LATEST_COUNT))}>
          Latest {Math.min(LATEST_COUNT, matches.length)}
        </Button>
        <Button compact onClick={() => select([])}>
          None
        </Button>
      </div>

      <ul className={styles.undoPanel__list}>
        {matches.map((match) => (
          <li key={keyOf(match)}>
            <label className={styles.undoPanel__row}>
              <Checkbox
                checked={selected.has(keyOf(match))}
                onChange={() => toggle(match)}
                aria-label={`Undo ${match.externalName}`}
              />
              <span className={styles.undoPanel__text}>
                <span className={styles.rowName}>
                  {match.externalName}
                  {!source && ` · ${SOURCE_LABELS[match.source]}`}
                </span>
                <span className={styles.undoPanel__games}>
                  {match.games.map((game) => (
                    <Link
                      key={game._id}
                      className={styles.rowCandidate}
                      href={`/games/${game.slug}`}
                      target="_blank"
                    >
                      {game.name}
                    </Link>
                  ))}
                </span>
              </span>
              <span className={styles.undoPanel__meta}>
                {match.confidence && (
                  <Badge tone={AI_CONFIDENCE_TONES[match.confidence]}>
                    {match.confidence}
                  </Badge>
                )}
                {match.decidedAt && commonUtils.formatDate(match.decidedAt)}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <Button
        color={ButtonColor.ACCENT}
        disabled={!picked.length || isPending}
        onClick={undo}
      >
        {isPending
          ? "Undoing…"
          : `Undo ${picked.length} ${picked.length === 1 ? "match" : "matches"}`}
      </Button>
    </div>
  );
};
