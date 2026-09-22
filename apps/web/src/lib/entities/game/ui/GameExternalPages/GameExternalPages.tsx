import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import styles from "./GameExternalPages.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button } from "@/src/lib/shared/ui/Button";
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { IGameResponse } from "@mooncellar/schemas";
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
import { ISvgBaseProps } from "@/src/lib/shared/ui/svg/Svg";
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
  const moreRef = useRef<HTMLButtonElement>(null);
  const [isMore, setIsMore] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const closePopover = useCallback(() => setIsPopoverOpen(false), []);

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
          ref={moreRef}
          color="transparent"
          tooltip={isPopoverOpen ? undefined : "All external pages"}
          active={isPopoverOpen}
          aria-expanded={isPopoverOpen}
          className={styles.stats__more}
          onClick={() => setIsPopoverOpen((isOpen) => !isOpen)}
        >
          <SvgMore />
        </Button>
      )}
      <Popover
        anchorRef={moreRef}
        isOpen={isPopoverOpen}
        onClose={closePopover}
        title="External pages"
        contentStyle={{ padding: "var(--padding-x2)" }}
      >
        <Scrollbar
          type="absolute"
          classNameContent={styles.popover__list}
          contentStyle={{ maxHeight: "var(--popover-max-height)" }}
        >
          {sortedItems.map((store, i) => {
            const StoreIcon =
              (store.name && storeIcons[store.name]) || SvgStore;

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
        </Scrollbar>
      </Popover>
    </div>
  );

  if (!isBoxed) return content;

  return <Box contentStyle={{ padding: "var(--padding-x3)" }}>{content}</Box>;
};
