import { FC, useEffect, useRef } from "react";
import styles from "./ConsolesList.module.scss";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { IGDBList, RoyalList } from "@/src/lib/features/main";
import { IGDBApi } from "@/src/lib/shared/api";
import { useSelectedStore } from "@/src/lib/shared/store/selected.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";

export const ConsolesList: FC = () => {
  const { isRoyal, royalGames, setRoyal } = useSelectedStore();
  const { isLoading } = useStatesStore();
  const { setGenres, setGameModes, setSystems } = useCommonStore();

  useEffect(() => {
    if (isRoyal) return;

    IGDBApi.getGenres().then((response) => setGenres(response.data));
    IGDBApi.getModes().then((response) => setGameModes(response.data));
    IGDBApi.getPlatforms().then((response) => setSystems(response.data));
  }, [isRoyal, setGenres, setGameModes, setSystems]);

  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className={styles.consoles__list}>
      <div className={styles.consoles__options}>
        <label className={styles.consoles__toggle}>
          <ToggleSwitch
            defaultValue={isRoyal ? "right" : "left"}
            clickCallback={() => setRoyal(!isRoyal)}
            isDisabled={isLoading}
          />
          <span>
            Royal {!!royalGames?.length ? `(Games: ${royalGames.length})` : ""}
          </span>
        </label>
      </div>
      {!isRoyal && <IGDBList />}

      {isRoyal && <RoyalList />}
    </div>
  );
};
