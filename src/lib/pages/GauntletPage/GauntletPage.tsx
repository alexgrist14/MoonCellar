import { FC, useCallback, useEffect, useState } from "react";
import styles from "./GauntletPage.module.scss";
import { ConsolesList } from "../../widgets/main";
import { IGDBApi } from "../../shared/api";
import { WheelContainer } from "../../widgets/wheel";
import { getSegments } from "../../shared/utils/getSegments";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { useStatesStore } from "../../shared/store/states.store";
import { useCommonStore } from "../../shared/store/common.store";
import { getImageLink } from "../../shared/constants";
import { useGauntletFiltersStore } from "../../shared/store/filters.store";
import { axiosUtils } from "../../shared/utils/axios";
import Image from "next/image";
import classNames from "classnames";
import { IGDBScreenshot } from "../../shared/types/igdb";

export const GauntletPage: FC = () => {
  const [bg, setBg] = useState<IGDBScreenshot & { gameId: number }>();
  const [isImageReady, setIsImageReady] = useState(true);

  const {
    selectedGenres,
    selectedRating,
    selectedGameModes,
    selectedSystems,
    searchQuery,
    royalGames,
    setGames,
    excludedGameModes,
    excludedGenres,
    excludedSystems,
    selectedCategories,
    searchCompany,
    selectedYears,
    selectedThemes,
    excludedThemes,
  } = useGauntletFiltersStore();

  const {
    isLoading,
    setSegments,
    setStarted,
    setFinished,
    setLoading,
    isRoyal,
  } = useStatesStore();
  const { setWinner, winner } = useCommonStore();

  const getIGDBGames = useCallback(() => {
    if (isRoyal) return;

    IGDBApi.getGames({
      selected: {
        genres: selectedGenres?.map((genre) => genre._id),
        platforms: selectedSystems?.map((system) => system._id),
        modes: selectedGameModes?.map((mode) => mode._id),
        themes: selectedThemes?.map((mode) => mode._id),
      },
      excluded: {
        genres: excludedGenres?.map((genre) => genre._id),
        platforms: excludedSystems?.map((system) => system._id),
        modes: excludedGameModes?.map((mode) => mode._id),
        themes: excludedThemes?.map((mode) => mode._id),
      },
      company: searchCompany,
      categories: selectedCategories,
      take: 16,
      rating: selectedRating,
      search: searchQuery,
      isRandom: true,
      years: selectedYears,
    }).then((response) => {
      if (!!response.data.results.length) {
        setGames(response.data.results);
        setSegments(getSegments(response.data.results, 16));

        setStarted(true);
        setLoading(false);
        setWinner(undefined);
      } else {
        setLoading(false);
        setFinished(true);
        setWinner(undefined);
      }
    });
  }, [
    setLoading,
    setSegments,
    setStarted,
    setWinner,
    isRoyal,
    searchQuery,
    selectedGenres,
    selectedRating,
    selectedGameModes,
    selectedSystems,
    setFinished,
    setGames,
    excludedGenres,
    excludedSystems,
    excludedGameModes,
    searchCompany,
    selectedCategories,
    excludedThemes,
    selectedThemes,
    selectedYears,
  ]);

  useEffect(() => {
    if (isLoading && !isRoyal) {
      getIGDBGames();
    }
  }, [isLoading, getIGDBGames, isRoyal]);

  useEffect(() => {
    isRoyal &&
      !!royalGames &&
      setSegments(royalGames.map((game, i) => game._id + "_" + i));
  }, [isRoyal, royalGames, setSegments]);

  useEffect(() => {
    const pictures: number[] = [];

    if (!!winner) {
      winner.artworks.forEach((id) => pictures.push(id));
      winner.screenshots.forEach((id) => pictures.push(id));

      const id = pictures[Math.floor(Math.random() * (pictures.length - 1))];

      !!id &&
        IGDBApi.getArt(id)
          .then((res) => {
            setIsImageReady(false);
            setBg({ ...res.data, gameId: winner._id });
          })
          .catch(axiosUtils.toastError);
    }
  }, [winner]);

  return (
    <div className={styles.page}>
      <div
        className={classNames(styles.page__bg, {
          [styles.page__bg_active]:
            !!bg && !!winner && winner._id === bg.gameId && isImageReady,
        })}
      >
        <Image
          onLoad={() => setIsImageReady(true)}
          key={bg?._id}
          alt="Background"
          src={!!bg ? getImageLink(bg.url, "1080p") : ""}
          width={1920}
          height={1080}
        />
      </div>
      <ExpandMenu id="consoles" titleOpen="Filters">
        <ConsolesList />
      </ExpandMenu>
      <WheelContainer />
    </div>
  );
};
