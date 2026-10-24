import { FC } from "react";
import { IGamePlayerGameAchievements } from "@mooncellar/schemas";
import { useGameBySlugQuery } from "@/src/lib/entities/game/api/game.queries";
import { GameCard, GameCardSkeleton } from "@/src/lib/widgets/game/GameCard";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { PORT_CARD_STYLE } from "./UserPortGame";
import styles from "./UserPortAchievements.module.scss";

interface IUserPortCardProps {
  summary: IGamePlayerGameAchievements;
  siteGame?: string | null;
}

// One port in the profile's compact block: the game card captioned with the unlocked count
export const UserPortCard: FC<IUserPortCardProps> = ({ summary, siteGame }) => {
  const { data: game, isLoading } = useGameBySlugQuery(siteGame);
  const { unlocked, total, lastUnlockedAt } = summary;
  const isMastered = !!total && unlocked >= total;

  return (
    <>
      {game ? (
        <GameCard game={game} style={PORT_CARD_STYLE} />
      ) : isLoading ? (
        <GameCardSkeleton style={PORT_CARD_STYLE} />
      ) : (
        <span className={styles.ports__name}>{summary.name}</span>
      )}
      <Badge
        className={styles.ports__badge}
        tone={isMastered ? "attention" : unlocked ? "neutral" : "muted"}
      >
        {isMastered ? "Mastered" : `${unlocked} / ${total}`}
      </Badge>
      <span className={styles.ports__date}>
        {[
          total ? `${Math.floor((unlocked * 100) / total)}%` : null,
          lastUnlockedAt ? commonUtils.formatDate(lastUnlockedAt) : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </>
  );
};
