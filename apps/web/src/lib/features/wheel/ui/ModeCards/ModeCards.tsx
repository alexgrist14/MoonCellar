"use client";

import { FC, ReactNode } from "react";
import classNames from "classnames";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { SvgRandom } from "@/src/lib/shared/ui/svg";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";
import styles from "./ModeCards.module.scss";

interface IModeCardsProps {
  gauntletCount?: ReactNode;
  royalCount?: ReactNode;
}

export const ModeCards: FC<IModeCardsProps> = ({
  gauntletCount,
  royalCount,
}) => {
  const isRoyal = !!useStatesStore((state) => state.isRoyal);
  const setRoyal = useStatesStore((state) => state.setRoyal);

  const cards = [
    {
      isRoyal: false,
      name: "Gauntlet",
      text: "One spin over the whole catalogue",
      icon: <SvgRandom />,
      count: gauntletCount,
    },
    {
      isRoyal: true,
      name: "Royal",
      text: "Knock-out over your crowned games",
      icon: <SvgCrown />,
      count: royalCount,
    },
  ];

  return (
    <div className={styles.modes} role="radiogroup" aria-label="Gauntlet mode">
      {cards.map((card) => {
        const isActive = card.isRoyal === isRoyal;

        return (
          <button
            key={card.name}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={classNames(styles.card, {
              [styles.card_royal]: card.isRoyal,
            })}
            onClick={() => setRoyal(card.isRoyal)}
          >
            <span className={styles.card__icon}>{card.icon}</span>
            <span className={styles.card__body}>
              <span className={styles.card__name}>{card.name}</span>
              <span className={styles.card__text}>{card.text}</span>
              <span
                className={styles.card__count}
                aria-hidden={!card.count || undefined}
              >
                {card.count || "\u00a0"}
              </span>
            </span>
            <span className={styles.card__radio} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};
