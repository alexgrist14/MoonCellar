import { useDebouncedCallback } from "use-debounce";
import { Input } from "../Input";
import styles from "./SearchModal.module.scss";
import { FC, useEffect, useMemo, useState } from "react";
import { IGDBApi } from "../../api";
import { IGDBGameMinimal } from "../../types/igdb";
import { Scrollbar } from "../Scrollbar";
import { Button } from "../Button";
import { GameCard } from "../GameCard";
import classNames from "classnames";
import { useCommonStore } from "../../store/common.store";
import { Loader } from "../Loader";
import { ButtonGroup } from "../Button/ButtonGroup";
import { modal } from "../Modal";
import { useDisableScroll, useWindowResizeAction } from "../../hooks";
import Link from "next/link";
import { screenGt, screenLg, screenMd, screenSm } from "../../constants";

export const SearchModal: FC = () => {
  const { setExpanded } = useCommonStore();

  const [games, setGames] = useState<IGDBGameMinimal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [take, setTake] = useState(17);
  const [total, setTotal] = useState<number>();

  const isSearchActive = useMemo(
    () => !!searchQuery && searchQuery.length >= 2,
    [searchQuery]
  );

  const debouncedSearch = useDebouncedCallback(() => {
    IGDBApi.getGames({
      search: searchQuery,
      take,
    }).then((response) => {
      setGames(response.data.results);
      setTotal(response.data.total);
      setIsLoading(false);
    });
  }, 300);

  useEffect(() => {
    if (isSearchActive) {
      setIsLoading(true);
      debouncedSearch();
    } else {
      setTimeout(() => setGames([]), 400);
    }
  }, [searchQuery, debouncedSearch, isSearchActive]);

  useDisableScroll();

  useWindowResizeAction(() => {
    if (window.innerWidth >= screenGt) return setTake(42);
    if (window.innerWidth >= screenLg) return setTake(35);
    if (window.innerWidth >= screenMd) return setTake(28);
    if (window.innerWidth >= screenSm) return setTake(21);

    return setTake(14);
  });

  return (
    <div className={styles.modal}>
      <div className={styles.modal__search}>
        <Input
          value={searchQuery}
          placeholder="Search..."
          autoFocus
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <ButtonGroup
          wrapperClassName={styles.modal__buttons}
          buttons={[
            {
              title: "Advanced",
              link: "/games",
              callback: () => {
                modal.close();
                setExpanded("left");
              },
            },
          ]}
        />
      </div>
      {isSearchActive && (
        <Scrollbar
          stl={styles}
          type="absolute"
          classNameContent={classNames(styles.modal__results, {
            [styles.modal__results_loading]: isLoading,
          })}
        >
          {games?.map((game) => (
            <GameCard key={game._id} game={game} />
          ))}
          {!!games?.length && !!total && take < total && (
            <Link
              className={styles.modal__more}
              href={`/games?search=${encodeURIComponent(searchQuery)}&page=2`}
              onClick={() => modal.close()}
            >
              <Button>More games</Button>
            </Link>
          )}
        </Scrollbar>
      )}
      {!games?.length && isSearchActive && (
        <div className={styles.modal__empty}>
          {isLoading ? <Loader type="pacman" /> : "Games not found"}
        </div>
      )}
    </div>
  );
};
