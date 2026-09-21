import { CSSProperties, FC, useMemo } from "react";
import classNames from "classnames";
import { IGameResponse } from "@mooncellar/schemas";
import { FavoriteButton } from "@/src/lib/features/favorites/ui/FavoriteButton";
import { ListsButton } from "@/src/lib/features/lists/ui/ListsButton";
import { useAuthStore } from "../../store/auth.store";
import { useUserStore } from "../../store/user.store";
import { commonUtils } from "../../utils/common.utils";
import { GameButtons } from "../GameButtons";
import { modal } from "../Modal";
import { PlaythroughModal } from "../PlaythroughModal";
import { SvgMore, SvgPlay } from "../svg";
import { GameControlButton } from "./GameControlButton";
import { getPlaythroughsTone } from "./gameControls.utils";
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
        data-prevent-progress
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
