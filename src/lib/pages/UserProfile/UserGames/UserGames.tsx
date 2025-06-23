import { IGDBApi } from "@/src/lib/shared/api";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { SortType } from "@/src/lib/shared/types/sort";
import { CategoriesType, IGamesRating } from "@/src/lib/shared/types/user.type";
import { CustomDropdown } from "@/src/lib/shared/ui/CustomDropdown";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SvgArrowPointer } from "@/src/lib/shared/ui/svg";
import { Icon } from "@iconify/react";
import classNames from "classnames";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./UserGames.module.scss";
import { useSearchParams } from "next/navigation";
import useCloseEvents from "@/src/lib/shared/hooks/useCloseEvents";
import { IPlaythroughMinimal } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { useDebouncedCallback } from "use-debounce";
import { useAsyncLoader } from "@/src/lib/shared/hooks/useAsyncLoader";
import { accentColor, accentColorRGB } from "@/src/lib/shared/constants";
import { commonUtils } from "@/src/lib/shared/utils/common";

interface UserGamesProps {
  gamesRating: IGamesRating[];
  playthroughs: IPlaythroughMinimal[];
}

const take = 30;
const sortOptions = [
  { label: SortType.DATE_ADDED },
  { label: SortType.RATING },
  // { label: SortType.TITLE },
];
const sortOrderOptions = [{ label: "asc" }, { label: "desc" }];

export const UserGames: FC<UserGamesProps> = ({
  gamesRating,
  playthroughs,
}) => {
  const { sync, isLoading, setIsLoading } = useAsyncLoader();

  const query = useSearchParams();
  const page = Number(query.get("page"));
  const list = query.get("list") as CategoriesType;

  const sortRef = useRef<HTMLDivElement>(null);

  const [total, setTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedSort, setSelectedSort] = useState<SortType>(
    SortType.DATE_ADDED
  );
  const [games, setGames] = useState<IGDBGameMinimal[]>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const playthroughsCount = useRef<{ [key: number]: number }>({});

  const parsedGamesRatings = useMemo(() => {
    return gamesRating.reduce(
      (res: { [key: number]: number }, rating) => ({
        ...res,
        [rating.game]: rating.rating,
      }),
      {}
    );
  }, [gamesRating]);

  const getGamesIds = useCallback(() => {
    const plays = playthroughs
      ?.filter(
        (play) =>
          (play.category === list && !play.isMastered) ||
          (list === "mastered" && play.isMastered)
      )
      .reduce((res: IPlaythroughMinimal[], play) => {
        let existed = res.find((item) => item.gameId === play.gameId);
        if (!!existed) {
          new Date(existed.updatedAt).getTime() <
            new Date(play.updatedAt).getTime() && (existed = play);

          playthroughsCount.current[play.gameId]++;
        } else {
          res.push(play);

          playthroughsCount.current[play.gameId] = 1;
        }

        return res;
      }, []);

    setTotal(plays.length);

    switch (selectedSort) {
      case SortType.RATING:
        plays?.sort((a, b) => {
          const ratingA = parsedGamesRatings[a.gameId] || 0;
          const ratingB = parsedGamesRatings[b.gameId] || 0;

          if (!ratingB || !ratingA) return ratingA < ratingB ? 1 : -1;

          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      // case SortType.TITLE:
      //   plays?.sort((a, b) => {
      //     const nameA = a.name.toLowerCase();
      //     const nameB = b.name.toLowerCase();
      //     return sortOrder === "asc"
      //       ? nameA.localeCompare(nameB)
      //       : nameB.localeCompare(nameA);
      //   });
      //   break;
      case SortType.DATE_ADDED:
        plays?.sort((a, b) => {
          const dateA = !!a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = !!b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
        break;
    }

    return plays.map((play) => play.gameId);
  }, [list, playthroughs, parsedGamesRatings, selectedSort, sortOrder]);

  const debouncedGetGames = useDebouncedCallback((page: number = 1) => {
    const _ids = getGamesIds().slice((page - 1) * take, page * take);

    !!_ids?.length &&
      sync(() =>
        IGDBApi.getGamesByIds({
          _ids,
        }).then((res) => {
          setGames(
            _ids.reduce((result: IGDBGameMinimal[], id) => {
              const game = res.data.find((game) => game._id === id);
              !!game && result.push(game);
              return result;
            }, [])
          );
        })
      );
  }, 200);

  useEffect(() => {
    setGames(undefined);
  }, [list]);

  useEffect(() => {
    !games && debouncedGetGames(page);
  }, [debouncedGetGames, page, games]);

  useCloseEvents([sortRef], () => setIsDropdownOpen(false));

  const handleSortChange = (value: SortType) => {
    setSelectedSort(value);
    debouncedGetGames(page);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
    debouncedGetGames(page);
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.sort}
        ref={sortRef}
        onClick={() => setIsDropdownOpen((prev) => !prev)}
      >
        <div className={styles.sort__icon_container}>
          <SvgArrowPointer className={styles.sort__icon} />
          <Icon
            className={classNames(styles.sort__icon, {
              [styles.sort__icon_active]: sortOrder === "asc",
            })}
            icon="iconamoon:sorting-left"
          />
        </div>
        <CustomDropdown
          isOpen={isDropdownOpen}
          setIsOpen={setIsDropdownOpen}
          onSelect={handleSortChange}
          onExtendedSelect={handleSortOrderChange}
          extendedSelected={sortOrder}
          options={sortOptions}
          selected={selectedSort}
          extendedOptions={sortOrderOptions}
          className={styles.sort__dropdown}
        />
      </div>

      <div className={classNames(styles.games)}>
        {isLoading ? (
          <Loader type="moon" />
        ) : (
          games?.map((game) => (
            <div key={game._id} className={styles.games__game}>
              <GameCard game={game} />
              <div className={styles.games__info}>
                <p className={styles.games__title}>{game.name}</p>
                <p className={styles.games__plays}>
                  {playthroughsCount.current[game._id]}{" "}
                  {commonUtils.addLastS(
                    "Playthrough",
                    playthroughsCount.current[game._id]
                  )}
                </p>
                {parsedGamesRatings[game._id] && (
                  <div className={classNames(styles.games__icon)}>
                    <Icon
                      style={{
                        filter: `drop-shadow(0 0 ${parsedGamesRatings[game._id] * 0.05}rem ${accentColor})`,
                        backgroundColor: `rgba(${accentColorRGB}, ${parsedGamesRatings[game._id] * 0.1})`,
                      }}
                      className={classNames(styles.games__number)}
                      icon={`mdi:numeric-${parsedGamesRatings[game._id]}`}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <Pagination
          take={take}
          total={total}
          isFixed
          isDisabled={isLoading}
          callback={(page) => {
            setIsLoading(true);
            debouncedGetGames(page);
          }}
        />
        {!isLoading && !!games && !games.length && <p>There is no games</p>}
      </div>
    </div>
  );
};
