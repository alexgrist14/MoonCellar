import { FC, Fragment, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./AchievementsModal.module.scss";
import { RowsModal } from "../RowsModal";
import { Button, ButtonColor } from "../Button";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { IGameResponse } from "@mooncellar/schemas";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { IRAAward } from "@/src/lib/shared/types/retroachievements.type";

interface IAchievementsModalProps {
  game: IGameResponse;
}

const AWARD_PRIORITY = ["Mastery/Completion", "Game Beaten"];
const RA_MEDIA_URL = "https://media.retroachievements.org";

const getAwardIconSrc = (imageIcon: string) =>
  imageIcon.startsWith("http") ? imageIcon : `${RA_MEDIA_URL}${imageIcon}`;

export const AchievementsModal: FC<IAchievementsModalProps> = ({ game }) => {
  const profile = useAuthStore((s) => s.profile);
  const systems = useCommonStore((s) => s.systems);

  const awardsByRaId = useMemo(() => {
    const byRaId = new Map<number, IRAAward>();

    profile?.raAwards?.forEach((award) => {
      const existing = byRaId.get(award.awardData);
      const priority = AWARD_PRIORITY.indexOf(award.awardType);
      const existingPriority = existing
        ? AWARD_PRIORITY.indexOf(existing.awardType)
        : Infinity;

      if (
        !existing ||
        (priority !== -1 &&
          (existingPriority === -1 || priority < existingPriority))
      ) {
        byRaId.set(award.awardData, award);
      }
    });

    return byRaId;
  }, [profile]);

  const getConsoleName = (consoleId: number) =>
    systems?.find((sys) => sys.raId === consoleId)?.name;

  return (
    <RowsModal
      title="RetroAchievements"
      rows={(game.retroachievements ?? []).map(({ gameId, consoleId }) => {
        const award = awardsByRaId.get(gameId);

        return (
          <Fragment key={gameId}>
            {award && (
              <Image
                alt={award.title}
                src={getAwardIconSrc(award.imageIcon)}
                width={40}
                height={40}
                className={styles.row__icon}
              />
            )}
            <div className={styles.row__info}>
              <p className={styles.row__title}>{award?.title ?? game.name}</p>
              {award && (
                <div className={styles.row__meta}>
                  <span>{commonUtils.formatDate(award.awardedAt)}</span>
                  <span className={styles.row__dot} />
                  <span>{award.awardType}</span>
                </div>
              )}
              <Link
                href={`https://retroachievements.org/game/${gameId}`}
                target="_blank"
                className={styles.row__link}
              >
                <Button color={ButtonColor.DEFAULT}>
                  {award?.consoleName || getConsoleName(consoleId) || "Open"}
                </Button>
              </Link>
            </div>
          </Fragment>
        );
      })}
      emptyState={
        <Link
          href={`https://retroachievements.org/searchresults.php?s=${encodeURIComponent(game.name)}&t=1`}
          target="_blank"
          className={styles.fullButtonLink}
        >
          <Button color={ButtonColor.DEFAULT} className={styles.fullButton}>
            Open on RetroAchievements
          </Button>
        </Link>
      }
    />
  );
};
