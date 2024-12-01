import { FC, useEffect, useRef } from "react";
import styles from "./ConsolesList.module.scss";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { RoyalList } from "@/src/lib/features/main";
import { IGDBApi } from "@/src/lib/shared/api";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useGauntletFiltersStore } from "@/src/lib/shared/store/filters.store";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { Filters } from "@/src/lib/shared/ui/Filters";

export const ConsolesList: FC = () => {
  const { royalGames } = useGauntletFiltersStore();
  const { setGenres, setGameModes, setSystems } = useCommonStore();
  const { setSegments, setStarted, setFinished, setRoyal, isRoyal } =
    useStatesStore();
  const { setWinner } = useCommonStore();

  useEffect(() => {
    if (isRoyal) return;

    IGDBApi.getGenres().then((response) => setGenres(response.data));
    IGDBApi.getModes().then((response) => setGameModes(response.data));
    IGDBApi.getPlatforms().then((response) => setSystems(response.data));
  }, [isRoyal, setGenres, setGameModes, setSystems]);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWinner(undefined);
    setFinished(true);
    setStarted(false);
    setSegments([]);
  }, [isRoyal, setFinished, setWinner, setStarted, setSegments]);

  return (
    <div ref={contentRef} className={styles.consoles__list}>
      <div className={styles.consoles__options}>
        <Tabs
          contents={[
            {
              tabName: "General",
              style: { flexBasis: "50%" },
              onTabClick: () => setRoyal(false),
            },
            {
              tabName:
                "Royal" +
                (!!royalGames?.length ? ` (${royalGames.length})` : ""),
              style: { flexBasis: "50%" },
              onTabClick: () => setRoyal(true),
            },
          ]}
        />
      </div>
      {!isRoyal && <Filters isGauntlet />}
      {isRoyal && <RoyalList />}
    </div>
  );
};
