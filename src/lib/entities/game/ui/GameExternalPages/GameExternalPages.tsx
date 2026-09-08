import { FC, useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import styles from "./GameExternalPages.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button } from "@/src/lib/shared/ui/Button";
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";
import { RowsModal } from "@/src/lib/shared/ui/RowsModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import {
  SvgAmazon,
  SvgEpicGames,
  SvgGog,
  SvgMore,
  SvgPlaystation,
  SvgSteam,
  SvgStore,
  SvgTwitch,
  SvgXbox,
  SvgYoutube,
} from "@/src/lib/shared/ui/svg";
import { ISvgBaseProps } from "@/src/lib/shared/ui/svg/Svg/Svg";
import { getGameExternalPages } from "@/src/lib/shared/utils/links.utils";

const storeIcons: Record<string, FC<ISvgBaseProps>> = {
  Steam: SvgSteam,
  GOG: SvgGog,
  "Epic Games": SvgEpicGames,
  "PlayStation Store": SvgPlaystation,
  YouTube: SvgYoutube,
  Twitch: SvgTwitch,
  Amazon: SvgAmazon,
  Xbox: SvgXbox,
};

interface IGameExternalPagesProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameExternalPages: FC<IGameExternalPagesProps> = ({
  game,
  isBoxed = true,
}) => {
  const storeBoxRef = useRef<HTMLDivElement>(null);
  const [isMore, setIsMore] = useState(false);

  const storeItems = useMemo(() => getGameExternalPages(game), [game]);

  const sortedItems = useMemo(
    () =>
      storeItems.toSorted((a, b) =>
        !!a.name && !!b.name
          ? a.name === "Steam"
            ? -1
            : a.name.localeCompare(b.name)
          : 0
      ),
    [storeItems]
  );

  useEffect(() => {
    const height = storeBoxRef.current?.scrollHeight;

    setIsMore(!!height && height > 40);
  }, [storeItems]);

  if (!storeItems.length) return null;

  const openModal = () =>
    modal.open(
      <RowsModal
        title="External pages"
        classNameRow={styles.rowReset}
        rows={sortedItems.map((store, i) => {
          const StoreIcon = (store.name && storeIcons[store.name]) || SvgStore;

          return (
            <a
              key={store.uid + i}
              href={store.url!}
              target="_blank"
              rel="noreferrer"
              className={styles.row__button}
            >
              <span className={styles.row__icon}>
                <StoreIcon size="20" color="contrast" />
              </span>
              <div className={styles.row__info}>
                <p className={styles.row__title}>{store.name || "Store"}</p>
                <span className={styles.row__link}>{store.url}</span>
              </div>
            </a>
          );
        })}
      />,
      { id: "game-external-pages" }
    );

  const content = (
    <div className={styles.stats}>
      <h4>External pages:</h4>
      <div ref={storeBoxRef} className={styles.stats__stores}>
        {sortedItems.map((store, i) => {
          const StoreIcon = (store.name && storeIcons[store.name]) || SvgStore;

          return (
            <Tooltip
              key={store.uid + i}
              content={
                <div className={styles.stats__info}>
                  {store.name}
                  <br />
                  {store.url}
                </div>
              }
            >
              <a
                href={store.url!}
                target="_blank"
                rel="noreferrer"
                className={styles.stats__store}
              >
                <StoreIcon size="20" color="contrast" />
              </a>
            </Tooltip>
          );
        })}
      </div>
      {isMore && (
        <Button
          color="transparent"
          className={styles.stats__more}
          onClick={openModal}
        >
          <SvgMore />
        </Button>
      )}
    </div>
  );

  if (!isBoxed) return content;

  return <Box contentStyle={{ padding: "var(--padding-x3)" }}>{content}</Box>;
};
