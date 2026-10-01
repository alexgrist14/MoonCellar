import { FC } from "react";
import Link from "next/link";
import { IPossibleDuplicate } from "@mooncellar/schemas";
import { modal } from "@/src/lib/shared/ui/Modal";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import styles from "./PossibleDuplicates.module.scss";

const MODAL_ID = "possible-duplicates";

type IDuplicateKind = "game" | "character";

export const PossibleDuplicates: FC<{
  duplicates: IPossibleDuplicate[];
  kind?: IDuplicateKind;
}> = ({ duplicates, kind = "game" }) => (
  <span className={styles.duplicates}>
    {kind === "game" ? (
      <span>The catalogue already has games that look the same:</span>
    ) : (
      <span>The catalogue already has characters with this name:</span>
    )}
    <span className={styles.list}>
      {duplicates.map(({ _id, name, slug, score }) =>
        kind === "game" ? (
          <Link key={_id} href={`/games/${slug}`} target="_blank">
            {name} <span className={styles.score}>score {score}</span>
          </Link>
        ) : (
          <span key={_id}>
            {name} <span className={styles.score}>{slug}</span>
          </span>
        )
      )}
    </span>
  </span>
);

export const confirmPossibleDuplicates = (
  duplicates: IPossibleDuplicate[],
  onConfirm: () => void,
  kind: IDuplicateKind = "game"
) =>
  modal.open(
    <ConfirmModal
      title="Possible duplicate"
      message={<PossibleDuplicates duplicates={duplicates} kind={kind} />}
      warning={`Check them first. Create a new ${kind} only if none of them is the same ${kind}.`}
      confirmText="Create anyway"
      onConfirm={() => {
        modal.close(MODAL_ID);
        onConfirm();
      }}
      onCancel={() => modal.close(MODAL_ID)}
    />,
    { id: MODAL_ID }
  );
