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
import { axiosUtils } from "../../shared/utils/axios";
import Image from "next/image";
import classNames from "classnames";
import { IGDBScreenshot } from "../../shared/types/igdb";
import { useGamesStore } from "../../shared/store/games.store";
import { parseQueryFilters } from "../../shared/utils/filters.util";
import { useRouter } from "next/router";

export const GauntletPage: FC = () => {
  const { asPath } = useRouter();

  const [bg, setBg] = useState<IGDBScreenshot & { gameId: number }>();
  const [isImageReady, setIsImageReady] = useState(true);

  const { royalGames, setGames, historyGames } = useGamesStore();
  const {
    isLoading,
    setSegments,
    setStarted,
    setFinished,
    setLoading,
    isRoyal,
    isExcludeHistory,
  } = useStatesStore();
  const { setWinner, winner } = useCommonStore();

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
        setSegments(getSegments(response.data.results, 16));

        setStarted(true);
        setLoading(false);
        setWinner(undefined);
      } else {
        setLoading(false);
        setFinished(true);
        setWinner(undefined);
        setSegments([]);
      }
    });
  }, [
    setLoading,
    setSegments,
    setStarted,
    setWinner,
    isRoyal,
    historyGames,
    isExcludeHistory,
    asPath,
    setFinished,
    setGames,
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
          src={!!bg?.url ? getImageLink(bg.url, "1080p") : "/images/moon.jpg"}
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
