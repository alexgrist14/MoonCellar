import { FC, useMemo } from "react";
import Link from "next/link";
import styles from "./AchievementsModal.module.scss";
import { WrapperTemplate } from "../WrapperTemplate";
import { Button, ButtonColor } from "../Button";
import { useAuthStore } from "../../store/auth.store";
import { useCommonStore } from "../../store/common.store";
import { IGameResponse } from "../../lib/schemas/games.schema";

interface IAchievementsModalProps {
  game: IGameResponse;
}

const AWARD_PRIORITY = ["Mastery/Completion", "Game Beaten"];

export const AchievementsModal: FC<IAchievementsModalProps> = ({ game }) => {
  const profile = useAuthStore((s) => s.profile);
  const systems = useCommonStore((s) => s.systems);

  const gameAwards = useMemo(() => {
    if (!profile?.raAwards?.length || !game.retroachievements?.length) {
      return [];
    }

    const raIds = new Set(game.retroachievements.map((item) => item.gameId));
    const matched = profile.raAwards.filter((award) =>
      raIds.has(award.awardData)
    );

    const byConsole = new Map<number, (typeof matched)[number]>();

    matched.forEach((award) => {
      const existing = byConsole.get(award.awardData);
      const priority = AWARD_PRIORITY.indexOf(award.awardType);
      const existingPriority = existing
        ? AWARD_PRIORITY.indexOf(existing.awardType)
        : Infinity;

      if (
        !existing ||
        (priority !== -1 &&
          (existingPriority === -1 || priority < existingPriority))
      ) {
        byConsole.set(award.awardData, award);
      }
    });

    return Array.from(byConsole.values());
  }, [profile, game.retroachievements]);

  const fallbackConsoleName = systems?.find(
    (sys) => sys.raId === game.retroachievements?.[0]?.consoleId
  )?.name;

  const fallbackLink = game.retroachievements?.[0]?.gameId
    ? `https://retroachievements.org/game/${game.retroachievements[0].gameId}`
    : `https://retroachievements.org/searchresults.php?s=${game.name}&t=1`;

  return (
    <WrapperTemplate
      title="RetroAchievements"
      isWithScrollBar
      contentStyle={{ padding: "15px" }}
      classNameContent={styles.modal}
    >
      {gameAwards.length ? (
        gameAwards.map((award, i) => (
          <div key={award.title + award.awardType + i} className={styles.row}>
            <div className={styles.row__info}>
              <p className={styles.row__title}>{award.title}</p>
              <p className={styles.row__meta}>{award.consoleName}</p>
              <p className={styles.row__meta}>{award.awardType}</p>
            </div>
            <Link
              href={`https://retroachievements.org/game/${award.awardData}`}
              target="_blank"
            >
              <Button color={ButtonColor.DEFAULT}>
                {award.consoleName || "Open"}
              </Button>
            </Link>
          </div>
        ))
      ) : (
        <Link
          href={fallbackLink}
          target="_blank"
          className={styles.fullButtonLink}
        >
          <Button color={ButtonColor.DEFAULT} className={styles.fullButton}>
            {fallbackConsoleName || "Open on RetroAchievements"}
          </Button>
        </Link>
      )}
    </WrapperTemplate>
  );
};
