import { FC } from "react";
import Image from "next/image";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { StatRows, type IStatRow } from "@/src/lib/shared/ui/StatRows";
import { SvgRetroAchievements, SvgSteam } from "@/src/lib/shared/ui/svg";
import { modal } from "@/src/lib/shared/ui/Modal";
import { IGameResponse } from "@mooncellar/schemas";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { IPortGameAchievements } from "@/src/lib/entities/port-achievement/model";
import {
  GAME_PORT_ACHIEVEMENTS_MODAL_ID,
  GamePortAchievementsModal,
} from "@/src/lib/widgets/game/GamePortAchievementsModal";

interface IGameAchievementsBlockProps {
  game: IGameResponse;
  portAchievements?: IPortGameAchievements;
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
  portAchievements,
  isBoxed = true,
}) => {
  const { steam } = getAchievementCounts(game);
  const systems = useCommonStore((state) => state.systems);
  const steamAppId = game.steamAchievements?.appId;

  const portTotal = portAchievements?.total;

  const rows: IStatRow[] = [
    ...(portAchievements && portTotal
      ? [
          {
            label: portAchievements.port.name,
            value: portTotal,
            icon: (
              <Image
                src="/images/logo-icon.png"
                alt=""
                width={16}
                height={16}
              />
            ),
            title: `${portTotal} achievements in ${portAchievements.port.name}, the PC port by MoonCellar Team`,
            onClick: () =>
              modal.open(
                <GamePortAchievementsModal achievements={portAchievements} />,
                { id: GAME_PORT_ACHIEVEMENTS_MODAL_ID }
              ),
          },
        ]
      : []),
    ...(steam
      ? [
          {
            label: "Steam",
            value: steam,
            icon: <SvgSteam size="16" />,
            title: `${steam} achievements on Steam`,
            ...(!!steamAppId && {
              href: `https://steamcommunity.com/stats/${steamAppId}/achievements`,
              isExternal: true,
            }),
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
          href: `https://retroachievements.org/game/${gameId}`,
          isExternal: true,
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
