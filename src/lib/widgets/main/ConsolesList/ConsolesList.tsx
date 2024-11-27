import { FC, useEffect, useRef } from "react";
import styles from "./ConsolesList.module.scss";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { IGDBList, RoyalList } from "@/src/lib/features/main";
import { IGDBApi } from "@/src/lib/shared/api";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useGauntletFiltersStore } from "@/src/lib/shared/store/filters.store";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { title } from "process";
import { Tabs } from "@/src/lib/shared/ui/Tabs";

export const ConsolesList: FC = () => {
  const { royalGames } = useGauntletFiltersStore();
  const { setGenres, setGameModes, setSystems } = useCommonStore();
  const { isLoading, setSegments, setStarted, setFinished, setRoyal, isRoyal } =
    useStatesStore();
  const { setWinner } = useCommonStore();

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
        <Tabs
          contents={[
            {
              tabName: "General",
              style: { flexBasis: "50%" },
              onTabClick: () => {
                setRoyal(false);
                setWinner(undefined);
                setFinished(true);
                setStarted(false);
                setSegments([]);
              },
            },
            {
              tabName:
                "Royal" +
                (!!royalGames?.length ? ` (Games: ${royalGames.length})` : ""),
              style: { flexBasis: "50%" },
              onTabClick: () => {
                setRoyal(true);
                setWinner(undefined);
                setFinished(true);
                setStarted(false);
                setSegments([]);
              },
            },
          ]}
        />
      </div>
      {!isRoyal && <IGDBList />}
      {isRoyal && <RoyalList />}
    </div>
  );
};
