"use client";

import { FC, RefObject, useMemo } from "react";
import Image from "next/image";
import classNames from "classnames";
import styles from "./GameAchievementsPopover.module.scss";
import { IGameResponse } from "@mooncellar/schemas";
import { IRAAward } from "@/src/lib/shared/types/retroachievements.type";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { SvgRetroAchievements } from "@/src/lib/shared/ui/svg";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";

interface IGameAchievementsPopoverProps {
  game: IGameResponse;
  anchorRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

const RA_MEDIA_URL = "https://media.retroachievements.org";

const AWARDS = {
  "Mastery/Completion": { label: "Mastered", tone: "attention" },
  "Game Beaten": { label: "Beaten", tone: "positive" },
} as const;

type IShownAwardType = keyof typeof AWARDS;

const isShownAward = (
  award: IRAAward
): award is IRAAward & { awardType: IShownAwardType } =>
  award.awardType in AWARDS;

const getIconSrc = (imageIcon: string) =>
  imageIcon.startsWith("http") ? imageIcon : `${RA_MEDIA_URL}${imageIcon}`;

export const GameAchievementsPopover: FC<IGameAchievementsPopoverProps> = ({
  game,
  anchorRef,
  isOpen,
  onClose,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const systems = useCommonStore((s) => s.systems);

  const rows = useMemo(() => {
    const awardsById = new Map<
      number,
      IRAAward & { awardType: IShownAwardType }
    >();

    profile?.raAwards?.filter(isShownAward).forEach((award) => {
      const existing = awardsById.get(award.awardData);

      if (!existing || award.awardType === "Mastery/Completion") {
        awardsById.set(award.awardData, award);
      }
    });

    return (game.retroachievements ?? [])
      .map(({ gameId, consoleId, consoleName, imageIcon, numAchievements }) => {
        const award = awardsById.get(gameId);
        const icon = imageIcon ?? award?.imageIcon;

        return {
          gameId,
          award,
          iconSrc: icon ? getIconSrc(icon) : undefined,
          consoleName:
            consoleName ??
            award?.consoleName ??
            systems?.find((system) => system.raId === consoleId)?.name ??
            "RetroAchievements",
          numAchievements,
        };
      })
      .sort(
        (a, b) =>
          Number(!!b.award) - Number(!!a.award) ||
          (b.award?.awardedAt ?? "").localeCompare(a.award?.awardedAt ?? "")
      );
  }, [game, profile, systems]);

  const hasAwards = rows.some((row) => !!row.award);

  return (
    <Popover
      anchorRef={anchorRef}
      isOpen={isOpen}
      onClose={onClose}
      align="end"
      title="RetroAchievements"
    >
      <div className={styles.achievements}>
        {!!profile && !hasAwards && (
          <p className={styles.achievements__hint}>
            No awards yet. Beat or master a set on RetroAchievements and it
            shows up here.
          </p>
        )}
        <ul className={styles.achievements__list}>
          {rows.map((row) => (
            <li key={row.gameId}>
              <a
                href={`https://retroachievements.org/game/${row.gameId}`}
                target="_blank"
                rel="noreferrer"
                className={styles.row}
              >
                {row.iconSrc ? (
                  <Image
                    alt=""
                    src={row.iconSrc}
                    width={96}
                    height={96}
                    className={classNames(styles.row__icon, {
                      [styles.row__icon_dim]: !row.award,
                    })}
                  />
                ) : (
                  <span
                    className={classNames(
                      styles.row__icon,
                      styles.row__icon_empty
                    )}
                  >
                    <SvgRetroAchievements size="20" color="secondary" />
                  </span>
                )}
                <span className={styles.row__text}>
                  <span className={styles.row__console}>{row.consoleName}</span>
                  <span className={styles.row__sub}>
                    {row.award
                      ? `${AWARDS[row.award.awardType].label} on ${commonUtils.formatDate(row.award.awardedAt)}`
                      : row.numAchievements !== undefined
                        ? `${row.numAchievements} achievements`
                        : "Open on RetroAchievements"}
                  </span>
                </span>
                {row.award && (
                  <Badge tone={AWARDS[row.award.awardType].tone}>
                    {AWARDS[row.award.awardType].label}
                  </Badge>
                )}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Popover>
  );
};
