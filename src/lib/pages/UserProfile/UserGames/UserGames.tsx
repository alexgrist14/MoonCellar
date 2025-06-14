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
import { FC, useEffect, useMemo, useRef, useState } from "react";
import styles from "./UserGames.module.scss";
import { useSearchParams } from "next/navigation";
import useCloseEvents from "@/src/lib/shared/hooks/useCloseEvents";
import { IPlaythroughMinimal } from "@/src/lib/shared/lib/schemas/playthroughs.schema";

interface UserGamesProps {
  gamesRating: IGamesRating[];
  playthroughs: IPlaythroughMinimal[];
}

const take = 30;

export const UserGames: FC<UserGamesProps> = ({
  gamesRating,
  playthroughs,
}) => {
  const query = useSearchParams();
  const page = Number(query.get("page"));
  const list = query.get("list") as CategoriesType;

  const sortOptions = [
    { label: SortType.DATE_ADDED },
    { label: SortType.RATING },
    { label: SortType.TITLE },
  ];

  const sortOrderOptions = [{ label: "asc" }, { label: "desc" }];

  const sortRef = useRef<HTMLDivElement>(null);

  const [total, setTotal] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedSort, setSelectedSort] = useState<SortType>(
    SortType.DATE_ADDED
  );
  const [games, setGames] = useState<IGDBGameMinimal[]>();
  const [sortedGames, setSortedGames] = useState<IGDBGameMinimal[]>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const gamesIds = useMemo(
    () =>
      playthroughs
        ?.filter(
          (play) =>
            (play.category === list && !play.isMastered) ||
            (list === "mastered" && play.isMastered)
        )
        .map((play) => play.gameId),
    [list, playthroughs]
  );

  const parsedGamesRatings = useMemo(() => {
    return gamesRating.reduce(
      (res: { [key: number]: number }, rating) => ({
        ...res,
        [rating.game]: rating.rating,
      }),
      {}
    );
  }, [gamesRating]);

  const parsedPlaythroughs = useMemo(
    () =>
      playthroughs?.reduce(
        (res: { [key: number]: IPlaythroughMinimal }, play) => {
          const existed =
            res[play.gameId] && new Date(res[play.gameId].updatedAt)?.getTime();
          const newPlay = new Date(play.updatedAt)?.getTime();

          (!existed || existed < newPlay) && (res[play.gameId] = play);

          return res;
        },
        {}
      ),
    [playthroughs]
  );

  useEffect(() => {
    setGames(undefined);
    setSortedGames(undefined);
  }, [list]);

  useEffect(() => {
    !!gamesIds?.length &&
      !games &&
      IGDBApi.getGamesByIds({ _ids: gamesIds }).then((res) => {
        setGames(res.data);
        setTotal(res.data.length);
      });
  }, [gamesIds, games]);

  useEffect(() => {
    if (!games?.length) return;

    let sorted = structuredClone(games);

    switch (selectedSort) {
      case SortType.RATING:
        sorted?.sort((a, b) => {
          const ratingA = parsedGamesRatings[a._id];
          const ratingB = parsedGamesRatings[b._id];
          if (!ratingB || !ratingA) return 1;
          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      case SortType.TITLE:
        sorted?.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          return sortOrder === "asc"
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
        break;
      case SortType.DATE_ADDED:
        sorted?.sort((a, b) => {
          const dateA = !!parsedPlaythroughs?.[a._id]
            ? new Date(parsedPlaythroughs[a._id].updatedAt).getTime()
            : 0;
          const dateB = !!parsedPlaythroughs?.[b._id]
            ? new Date(parsedPlaythroughs[b._id].updatedAt).getTime()
            : 0;

          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
        break;
    }

    setSortedGames(sorted);
  }, [games, selectedSort, sortOrder, parsedGamesRatings, parsedPlaythroughs]);

  useCloseEvents([sortRef], () => setIsDropdownOpen(false));

  const handleSortChange = (value: SortType) => {
    setSelectedSort(value);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
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
        {!!sortedGames ? (
          sortedGames.slice((page - 1) * take, page * take).map((game) => (
            <div key={game._id} style={{ display: "grid" }}>
              <GameCard game={game} />
              <div className={styles.games__info}>
                <p className={styles.games__title}>{game.name}</p>
                {gamesRating &&
                  gamesRating.find((rating) => rating.game === game._id)
                    ?.rating && (
                    <span className={styles.games__rating}>
                      {
                        gamesRating.find((rating) => rating.game === game._id)
                          ?.rating
                      }
                    </span>
                  )}
              </div>
            </div>
          ))
        ) : (
          <Loader type="moon" />
        )}

        <Pagination take={take} total={total} isFixed />
        {!!sortedGames && !sortedGames.length && <p>There is no games</p>}
      </div>
    </div>
  );
};
