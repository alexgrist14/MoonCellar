import { userAPI } from "@/src/lib/shared/api";
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
import { FC, useEffect, useRef, useState } from "react";
import styles from "./UserGames.module.scss";
import { useSearchParams } from "next/navigation";
import useCloseEvents from "@/src/lib/shared/hooks/useCloseEvents";

interface UserGamesProps {
  userId: string;
  gamesRating: IGamesRating[];
}

const take = 30;

export const UserGames: FC<UserGamesProps> = ({ userId, gamesRating }) => {
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
  const [sortedGames, setSortedGames] = useState<IGDBGameMinimal[]>();
  const [currentGames, setCurrentGames] = useState<IGDBGameMinimal[]>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setCurrentGames(undefined);
    setSortedGames(undefined);

    userAPI.getUserGames(userId, list).then((res) => {
      const games = res.data.games[list];
      setCurrentGames(games);
      setTotal(games.length);
    });
  }, [list, userId, gamesRating, selectedSort, sortOrder]);

  useEffect(() => {
    if (!sortedGames) return;

    let sorted = structuredClone(sortedGames);

    switch (selectedSort) {
      case SortType.RATING:
        sorted.sort((a, b) => {
          const ratingA =
            gamesRating.find((rating) => rating.game === a._id)?.rating || 0;
          const ratingB =
            gamesRating.find((rating) => rating.game === b._id)?.rating || 0;
          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      case SortType.TITLE:
        sorted.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          return sortOrder === "asc"
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
        break;
      case SortType.DATE_ADDED:
        sortOrder === "asc" ? (sorted = sorted.reverse()) : sorted;
        break;
    }

    setCurrentGames(sorted);
  }, [sortedGames, selectedSort, sortOrder, gamesRating]);

  console.log(total);

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
        {!!currentGames ? (
          currentGames.slice((page - 1) * take, page * take).map((game) => (
            <GameCard key={game._id} game={game}>
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
            </GameCard>
          ))
        ) : (
          <Loader type="moon" />
        )}

        <Pagination take={take} total={total} isFixed />
        {!!currentGames && !currentGames.length && <p>There is no games</p>}
      </div>
    </div>
  );
};
