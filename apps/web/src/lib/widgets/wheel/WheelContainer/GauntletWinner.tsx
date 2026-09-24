import { FC } from "react";
import Link from "next/link";
import { IGameResponse } from "@mooncellar/schemas";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { GameMedia } from "@/src/lib/entities/game/ui/GameMedia";
import { GameStatsBoxes } from "@/src/lib/entities/game/ui/GameStatsBoxes";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { ExpandableBlock } from "@/src/lib/shared/ui/ExpandableBlock";
import { SvgOpenWindow, SvgRandom } from "@/src/lib/shared/ui/svg";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { dateRegions } from "@/src/lib/shared/constants";
import styles from "./WheelContainer.module.scss";

const CARD_STYLE = {
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  maxHeight: "none",
  padding: 0,
};

interface IGauntletWinnerProps {
  game: IGameResponse;
  isRoyal: boolean;
}

export const GauntletWinner: FC<IGauntletWinnerProps> = ({ game, isRoyal }) => {
  const systems = useCommonStore((state) => state.systems);
  const hideMedia = useHideAdult() && isAdultGame(game);

  const year = game.first_release
    ? new Date(game.first_release * 1000).getFullYear()
    : undefined;

  const platformName = (id: string) =>
    systems?.find((system) => system._id === id)?.name;

  const facts = [
    {
      label: "Platforms",
      value: (game.platformIds ?? []).map(platformName).filter(Boolean),
    },
    { label: "Genres", value: game.genres ?? [] },
    { label: "Game modes", value: game.modes ?? [] },
    { label: "Themes", value: game.themes ?? [] },
    { label: "Languages", value: game.languages ?? [] },
  ].filter((fact) => fact.value.length);

  const platforms = (game.platformIds ?? []).flatMap((id) => {
    const platform = systems?.find((system) => system._id === id);

    return platform ? [platform] : [];
  });

  const releases = [...(game.release_dates ?? [])].sort(
    (a, b) => a.date - b.date
  );
  const hasMore = !!game.storyline || !!releases.length || !!facts.length;

  return (
    <article className={styles.winner}>
      <header className={styles.winner__head}>
        <div className={styles.winner__cover}>
          <GameCard game={game} isInfoDisabled style={CARD_STYLE} />
        </div>
        <div className={styles.winner__title}>
          <p className={styles.winner__eyebrow} data-royal={isRoyal}>
            {isRoyal ? <SvgCrown /> : <SvgRandom />}
            {isRoyal ? "Last one standing" : "The wheel chose"}
          </p>
          <h2 className={styles.winner__name}>{game.name}</h2>
          <div className={styles.winner__chips}>
            {!!year && <span>{year}</span>}
            {!!game.type && <span>{game.type}</span>}
            {!!game.genres?.[0] && <span>{game.genres[0]}</span>}
          </div>
          {!!platforms.length && (
            <div className={styles.winner__chips}>
              {platforms.map((platform) => (
                <Link
                  key={platform._id}
                  href={`/games/platform/${platform.slug}`}
                  className={styles.winner__chipLink}
                >
                  {platform.name}
                </Link>
              ))}
            </div>
          )}
          <Link href={`/games/${game.slug}`} className={styles.winner__open}>
            <SvgOpenWindow />
            Open game page
          </Link>
        </div>
      </header>

      <GameStatsBoxes game={game} isBoxed={false} />

      {!!game.summary && (
        <ExpandableBlock title="Summary" mode="scroll">
          <p className={styles.winner__summary}>{game.summary}</p>
        </ExpandableBlock>
      )}

      {!hideMedia && <GameMedia game={game} isBoxed={false} />}

      {hasMore && (
        <details className={styles.winner__more}>
          <summary>More about the game</summary>
          <div className={styles.winner__moreBody}>
            {!!facts.length && (
              <dl className={styles.winner__facts}>
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value.join(", ")}</dd>
                  </div>
                ))}
              </dl>
            )}
            {!!game.storyline && (
              <ExpandableBlock title="Storyline" mode="scroll">
                <p className={styles.winner__summary}>{game.storyline}</p>
              </ExpandableBlock>
            )}
            {!!releases.length && (
              <ul className={styles.winner__releases}>
                {releases.map((release, index) => (
                  <li key={`${release.date}-${index}`}>
                    {release.human} ·{" "}
                    {platformName(release.platformId) ?? "Unknown platform"}
                    {!!dateRegions[+release.region - 1] && (
                      <span> ({dateRegions[+release.region - 1]})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      )}
    </article>
  );
};
