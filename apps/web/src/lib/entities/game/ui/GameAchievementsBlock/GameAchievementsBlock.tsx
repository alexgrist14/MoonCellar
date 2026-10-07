import { FC } from "react";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { StatRows, type IStatRow } from "@/src/lib/shared/ui/StatRows";
import { SvgRetroAchievements, SvgSteam } from "@/src/lib/shared/ui/svg";
import { IGameResponse } from "@mooncellar/schemas";
import { useCommonStore } from "@/src/lib/shared/store/common.store";

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
  const { steam } = getAchievementCounts(game);
  const systems = useCommonStore((state) => state.systems);

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
    ...[...(game.retroachievements ?? [])]
      .filter(({ numAchievements }) => !!numAchievements)
      .sort((a, b) => (b.numAchievements ?? 0) - (a.numAchievements ?? 0))
      .map(({ gameId, consoleId, consoleName, numAchievements }) => {
        const platform =
          consoleName ??
          systems?.find((system) => system.raId === consoleId)?.name;

        return {
          key: `ra-${gameId}`,
          label: "RetroAchievements",
          sublabel: platform,
          value: numAchievements,
          icon: <SvgRetroAchievements size="20" />,
          title: `${numAchievements} achievements in the RetroAchievements set${platform ? ` for ${platform}` : ""}`,
        };
      }),
  ];

  if (!rows.length) return null;

  return (
    <InfoBlock title="Achievements:" isBoxed={isBoxed}>
      <StatRows rows={rows} />
    </InfoBlock>
  );
};
