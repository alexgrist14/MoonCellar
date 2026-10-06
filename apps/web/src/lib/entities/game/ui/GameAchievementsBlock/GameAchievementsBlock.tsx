import { FC } from "react";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { StatRows, type IStatRow } from "@/src/lib/shared/ui/StatRows";
import { SvgRetroAchievements, SvgSteam } from "@/src/lib/shared/ui/svg";
import { IGameResponse } from "@mooncellar/schemas";

interface IGameAchievementsBlockProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const getAchievementCounts = (game: IGameResponse) => ({
  steam: game.steamAchievements?.total ?? 0,
  retroachievements: (game.retroachievements ?? []).reduce(
    (sum, set) => sum + (set.numAchievements ?? 0),
    0
  ),
});

export const GameAchievementsBlock: FC<IGameAchievementsBlockProps> = ({
  game,
  isBoxed = true,
}) => {
  const { steam, retroachievements } = getAchievementCounts(game);

  const rows: IStatRow[] = [
    ...(steam
      ? [
          {
            label: "Steam",
            value: steam,
            icon: <SvgSteam size="16" />,
            title: `${steam} achievements on Steam`,
          },
        ]
      : []),
    ...(retroachievements
      ? [
          {
            label: "RetroAchievements",
            value: retroachievements,
            icon: <SvgRetroAchievements size="20" />,
            title: `${retroachievements} achievements across the RetroAchievements sets`,
          },
        ]
      : []),
  ];

  if (!rows.length) return null;

  return (
    <InfoBlock title="Achievements:" isBoxed={isBoxed}>
      <StatRows rows={rows} />
    </InfoBlock>
  );
};
