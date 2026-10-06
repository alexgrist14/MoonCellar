import { FC } from "react";
import classNames from "classnames";
import { SvgRandom } from "@/src/lib/shared/ui/svg";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";
import styles from "./WheelContainer.module.scss";

const MODE_COPY = {
  gauntlet: {
    title: "Let the wheel pick from the catalogue",
    lede: "For the evening you want to play something but not decide what. Narrow the catalogue as far as you like, spin, and take what comes out. Every result lands in History.",
    steps: [
      ["Narrow it down", "Open Filters, or keep everything"],
      ["Spin", "The wheel draws from all matching games"],
      ["Keep it or spin again", "Winners stay in Lists, under History"],
    ],
  },
  royal: {
    title: "Knock out your own shortlist",
    lede: "The wheel holds only the games you crowned. Each spin knocks out the game it lands on; the last one standing wins. Filters are off here — the list is the filter.",
    steps: [
      ["Crown the candidates", "Press the crown on any game card"],
      ["Spin to knock one out", "The game it lands on leaves the wheel"],
      ["Last one wins", "The round restarts with the full list"],
    ],
  },
};

interface IGauntletIntroProps {
  isRoyal: boolean;
}

export const GauntletIntro: FC<IGauntletIntroProps> = ({ isRoyal }) => {
  const copy = isRoyal ? MODE_COPY.royal : MODE_COPY.gauntlet;

  return (
    <div className={styles.intro}>
      <span
        className={classNames(styles.intro__icon, {
          [styles.intro__icon_royal]: isRoyal,
        })}
      >
        {isRoyal ? <SvgCrown size="28" /> : <SvgRandom size="28" />}
      </span>
      <h2 className={styles.intro__title}>{copy.title}</h2>
      <p className={styles.intro__lede}>{copy.lede}</p>
      <ol
        className={classNames(styles.steps, {
          [styles.steps_royal]: isRoyal,
        })}
      >
        {copy.steps.map(([head, text]) => (
          <li key={head} className={styles.step}>
            <span>
              <b>{head}</b>
              {text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};
