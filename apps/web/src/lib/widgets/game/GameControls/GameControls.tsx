import { CSSProperties, FC, useMemo } from "react";
import classNames from "classnames";
import { IGameResponse } from "@mooncellar/schemas";
import { FavoriteButton } from "@/src/lib/features/favorites/ui/FavoriteButton";
import { ListsButton } from "@/src/lib/features/lists/ui/ListsButton";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { GameButtons } from "@/src/lib/shared/ui/GameButtons";
import { modal } from "@/src/lib/shared/ui/Modal";
import { PlaythroughModal } from "@/src/lib/features/game/ui/PlaythroughModal";
import { SvgMore, SvgPlay } from "@/src/lib/shared/ui/svg";
import {
  GameControlButton,
  getPlaythroughsTone,
} from "@/src/lib/shared/ui/GameControlButton";
import styles from "./GameControls.module.scss";

interface IGameControlsProps {
  style?: CSSProperties;
  className?: string;
  game: IGameResponse;
}

const ICON_STYLE: CSSProperties = { color: "inherit" };

export const GameControls: FC<IGameControlsProps> = ({
  game,
  className,
  style,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const playthroughs = useUserStore((s) => s.parsedPlaythroughs?.[game._id]);

  const tone = useMemo(() => getPlaythroughsTone(playthroughs), [playthroughs]);
  const playsCount = playthroughs?.length ?? 0;

  const playthroughsTooltip = !profile?._id
    ? "You must be logged in to view playthroughs"
    : tone
      ? `${playsCount} ${commonUtils.addLastS("playthrough", playsCount)} · ${commonUtils.upFL(tone)}`
      : "Playthroughs";

  return (
    <div className={classNames(styles.controls, className)} style={style}>
      <GameControlButton
        icon={<SvgPlay size="16" style={ICON_STYLE} />}
        label="Playthroughs"
        tooltip={playthroughsTooltip}
        tooltipAlign="left"
        tone={tone}
        isActive={!!tone}
        badge={playsCount > 1 ? playsCount : undefined}
        isDisabled={!profile?._id}
        onClick={() =>
          !!game._id &&
          !!profile?._id &&
          modal.open(<PlaythroughModal game={game} userId={profile._id} />, {
            id: "game-playthroughs",
            isResizable: true,
          })
        }
      />
      <FavoriteButton game={game} />
      <ListsButton game={game} />
      <GameControlButton
        icon={<SvgMore size="16" style={ICON_STYLE} />}
        label="External links"
        tooltip="External links"
        tooltipAlign="right"
        onClick={() =>
          modal.open(<GameButtons game={game} />, { id: "game-menu" })
        }
      />
    </div>
  );
};
