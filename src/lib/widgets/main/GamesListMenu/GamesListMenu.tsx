"use client";

import { FC, useState } from "react";
import styles from "./GamesListMenu.module.scss";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { Button } from "@/src/lib/shared/ui/Button";
import { RoyalGamesPanel } from "@/src/lib/shared/ui/RoyalGamesPanel";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";

interface IGamesListMenuProps {
  games?: IGameResponse[];
}

export const GamesListMenu: FC<IGamesListMenuProps> = ({ games }) => {
  const addRoyalGames = useGamesStore((state) => state.addRoyalGames);

  const [tabIndex, setTabIndex] = useState(0);

  return (
    <div className={styles.menu__list}>
      <div className={styles.menu__options}>
        <Tabs
          defaultTabIndex={tabIndex}
          contents={[
            {
              tabName: "Controls",
              style: { flexBasis: "50%" },
              onTabClick: () => {
                setTabIndex(0);
              },
            },
            {
              tabName: "Royal",
              style: { flexBasis: "50%" },
              onTabClick: () => {
                setTabIndex(1);
              },
            },
          ]}
        />
      </div>
      {tabIndex === 0 && (
        <div className={styles.menu__controls}>
          <Button
            color={"default"}
            disabled={!games?.length}
            onClick={() => {
              if (!games?.length) return;

              addRoyalGames(games);
              toast.success({
                description: "Page games were added to Royal",
              });
            }}
          >
            Add page to Royal
          </Button>
        </div>
      )}
      {tabIndex === 1 && <RoyalGamesPanel />}
    </div>
  );
};
