import { FC } from "react";
import Link from "next/link";
import { IPossibleDuplicate } from "@mooncellar/schemas";
import { modal } from "@/src/lib/shared/ui/Modal";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import styles from "./PossibleDuplicates.module.scss";

const MODAL_ID = "possible-duplicates";

export const PossibleDuplicates: FC<{ duplicates: IPossibleDuplicate[] }> = ({
  duplicates,
}) => (
  <span className={styles.duplicates}>
    <span>The catalogue already has games that look the same:</span>
    <span className={styles.list}>
      {duplicates.map(({ _id, name, slug, score }) => (
        <Link key={_id} href={`/games/${slug}`} target="_blank">
          {name} <span className={styles.score}>score {score}</span>
        </Link>
      ))}
    </span>
  </span>
);

export const confirmPossibleDuplicates = (
  duplicates: IPossibleDuplicate[],
  onConfirm: () => void
) =>
  modal.open(
    <ConfirmModal
      title="Possible duplicate"
      message={<PossibleDuplicates duplicates={duplicates} />}
      warning="Open them first. Create a new game only if none of them is the same game."
      confirmText="Create anyway"
      onConfirm={() => {
        modal.close(MODAL_ID);
        onConfirm();
      }}
      onCancel={() => modal.close(MODAL_ID)}
    />,
    { id: MODAL_ID }
  );
