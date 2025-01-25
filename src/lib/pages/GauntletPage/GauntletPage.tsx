import { FC, useCallback, useEffect, useState } from "react";
import styles from "./GauntletPage.module.scss";
import { ConsolesList } from "../../widgets/main";
import { IGDBApi } from "../../shared/api";
import { WheelContainer } from "../../widgets/wheel";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { useStatesStore } from "../../shared/store/states.store";
import { getImageLink } from "../../shared/constants";
import { axiosUtils } from "../../shared/utils/axios";
import Image from "next/image";
import classNames from "classnames";
import { IGDBScreenshot } from "../../shared/types/igdb";
import { useGamesStore } from "../../shared/store/games.store";
import { parseQueryFilters } from "../../shared/utils/filters.util";
import { useRouter } from "next/router";
import { useCommonStore } from "../../shared/store/common.store";
import { Filters } from "../../shared/ui/Filters";

export const GauntletPage: FC = () => {
  const { asPath } = useRouter();

  const [bg, setBg] = useState<IGDBScreenshot & { gameId: number }>();
  const [isImageReady, setIsImageReady] = useState(true);

  const { setGenres, setGameModes, setSystems, setThemes } = useCommonStore();
  const { setGames, historyGames, winner, setWinner } = useGamesStore();
  const {
    isLoading,
    setStarted,
    setFinished,
    setLoading,
    isRoyal,
    isExcludeHistory,
  } = useStatesStore();

  const getIGDBGames = useCallback(() => {
    if (isRoyal) return;

    const filters = parseQueryFilters(asPath);

    IGDBApi.getGames({
      ...filters,
      isRandom: true,
      take: 16,
      ...(isExcludeHistory &&
        !!historyGames?.length && {
          excludeGames: historyGames.map((game) => game._id),
        }),
    }).then((response) => {
      if (!!response.data.results.length) {
        setGames(response.data.results);

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
    setStarted,
    setWinner,
    isRoyal,
    historyGames,
    isExcludeHistory,
    asPath,
    setFinished,
    setGames,
  ]);

  const isImageActive =
    !!bg && !!winner && winner._id === bg.gameId && isImageReady;

  useEffect(() => {
    if (isLoading && !isRoyal) {
      getIGDBGames();
    }
  }, [isLoading, getIGDBGames, isRoyal]);

  useEffect(() => {
    const pictures: number[] = [];

    setIsImageReady(false);

    if (!!winner) {
      if (!!winner.artworks?.length) {
        winner.artworks.forEach((id) => pictures.push(id));
      } else {
        winner.screenshots.forEach((id) => pictures.push(id));
      }

      const id = pictures[Math.floor(Math.random() * (pictures.length - 1))];

      if (!id) return;

      (!!winner.artworks?.length ? IGDBApi.getArtwork : IGDBApi.getScreenshot)(
        id
      )
        .then((res) => {
          setIsImageReady(false);
          setBg({ ...res.data, gameId: winner._id });
        })
        .catch(axiosUtils.toastError);
    }
  }, [winner]);

  useEffect(() => {
    if (isRoyal) return;

    IGDBApi.getGenres().then((response) => setGenres(response.data));
    IGDBApi.getModes().then((response) => setGameModes(response.data));
    IGDBApi.getPlatforms().then((response) => setSystems(response.data));
    IGDBApi.getThemes().then((response) => setThemes(response.data));
  }, [isRoyal, setGenres, setGameModes, setSystems, setThemes]);

  // useEffect(() => {
  //   isMobile === false && setExpanded("both");
  // }, [setExpanded, isMobile]);

  return (
    <div className={classNames(styles.page)}>
      {!isRoyal && (
        <ExpandMenu id="consoles" titleOpen="Filters" position="left">
          <Filters isGauntlet />
        </ExpandMenu>
      )}
      <ExpandMenu id="consoles" titleOpen="Lists" position="right">
        <ConsolesList />
      </ExpandMenu>
      <div
        className={classNames(styles.page__bg, styles.page__bg_default, {
          [styles.page__bg_hidden]: isImageActive,
        })}
      >
        <Image
          alt="Background"
          src={"/images/moon.jpg"}
          width={1920}
          height={1080}
        />
      </div>
      <div
        className={classNames(styles.page__bg, {
          [styles.page__bg_active]: isImageActive,
        })}
      >
        <Image
          onLoad={() => setIsImageReady(true)}
          key={bg?._id}
          alt="Background"
          src={!!bg?.url ? getImageLink(bg.url, "1080p") : "/images/moon.jpg"}
          width={1920}
          height={1080}
        />
      </div>
      <WheelContainer />
    </div>
  );
};
