"use client";

import { FC, useState } from "react";
import styles from "./GamesListMenu.module.scss";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { RoyalGamesPanel } from "@/src/lib/widgets/main/RoyalGamesPanel";
import { useRoyalGames } from "@/src/lib/entities/royal/model/useRoyalGames";
import { useGamesSelectionStore } from "@/src/lib/shared/store/games-selection.store";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { modal } from "@/src/lib/shared/ui/Modal";
import {
  ADD_GAMES_TO_LIST_MODAL_ID,
  AddGamesToListModal,
} from "@/src/lib/features/lists/ui/AddGamesToListModal";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { SvgListBullet } from "@/src/lib/shared/ui/svg";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";
import { IGameResponse } from "@mooncellar/schemas";

interface IGamesListMenuProps {
  games?: IGameResponse[];
}

export const GamesListMenu: FC<IGamesListMenuProps> = ({ games }) => {
  const { addRoyalGames } = useRoyalGames();
  const { profile, isAuth } = useAuthStore();

  const { isSelectMode, selected, setSelectMode, setSelected, clearSelected } =
    useGamesSelectionStore();

  const [tabIndex, setTabIndex] = useState(0);

  const pageIds = games?.map((game) => game._id) ?? [];
  const isAllSelected =
    !!pageIds.length && pageIds.every((id) => selected.includes(id));

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
          <ToggleSwitch
            label="Select mode:"
            value={isSelectMode ? "right" : "left"}
            clickCallback={(result) => setSelectMode(result === "ON")}
          />

          {isSelectMode && (
            <>
              <div className={styles.menu__selection}>
                <p className={styles.menu__count}>
                  {selected.length} of {pageIds.length} selected
                </p>
                <div className={styles.menu__row}>
                  <Button
                    disabled={!pageIds.length}
                    onClick={() => setSelected(isAllSelected ? [] : pageIds)}
                  >
                    {isAllSelected ? "Deselect all" : "Select all"}
                  </Button>
                  <Button
                    color={ButtonColor.TRANSPARENT}
                    disabled={!selected.length}
                    onClick={clearSelected}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <p className={styles.menu__label}>Add the selection to</p>
              <Button
                className={styles.menu__action}
                disabled={!selected.length}
                onClick={() => {
                  addRoyalGames(selected);
                  toast.success({
                    description: `${selected.length} added to Royal`,
                  });
                  clearSelected();
                }}
              >
                <SvgCrown size="16" />
                Royal games
              </Button>
              <Button
                className={styles.menu__action}
                color={ButtonColor.ACCENT}
                disabled={!selected.length || !isAuth || !profile?._id}
                tooltip={!isAuth ? "Sign in to use custom lists" : undefined}
                onClick={() =>
                  modal.open(
                    <AddGamesToListModal
                      userId={profile?._id ?? ""}
                      gameIds={selected}
                      onDone={clearSelected}
                    />,
                    { id: ADD_GAMES_TO_LIST_MODAL_ID }
                  )
                }
              >
                <SvgListBullet size="16" />A custom list...
              </Button>
            </>
          )}
        </div>
      )}
      {tabIndex === 1 && <RoyalGamesPanel />}
    </div>
  );
};
