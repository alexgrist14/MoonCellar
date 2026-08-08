import { Input } from "../Input";
import styles from "./SearchModal.module.scss";
import { FC, useEffect, useState } from "react";
import { Button } from "../Button";
import { Loader } from "../Loader";
import { ButtonGroup } from "../Button/ButtonGroup";
import { modal } from "../Modal";
import { useDisableScroll } from "../../hooks";
import Link from "next/link";
import { useDebounce } from "use-debounce";
import { useExpandStore } from "../../store/expand.store";
import { useAdvancedRouter } from "../../hooks/useAdvancedRouter";
import { GamesCards } from "../GamesCards";
import { takeGames } from "../../constants/games.const";
import classNames from "classnames";
import { useGamesQuery } from "@/src/lib/entities/game/api/game.queries";

export const SearchModal: FC = () => {
  const { setExpanded } = useExpandStore();
  const { asPath } = useAdvancedRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearch = searchQuery.trim();
  const [debouncedSearch] = useDebounce(normalizedSearch, 500);

  const isSearchActive = normalizedSearch.length >= 2;
  const isDebouncing = normalizedSearch !== debouncedSearch;

  const { data, isFetching } = useGamesQuery(
    { search: debouncedSearch, take: takeGames },
    debouncedSearch.length >= 2
  );

  const games = data?.results;
  const total = data?.total ?? 0;
  const isSearching = isDebouncing || isFetching;
  const showMoreGamesButton =
    !!games?.length &&
    !!total &&
    takeGames < total &&
    !isFetching &&
    !isDebouncing;
  useDisableScroll();

  useEffect(() => {
    isSearchActive && modal.close("search-games");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asPath]);

  return (
    <div
      className={classNames(styles.modal, {
        [styles.modal_active]: isSearchActive,
      })}
    >
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
              link: !!searchQuery
                ? `/games?search=${encodeURIComponent(searchQuery)}`
                : "/games",
              onClick: () => {
                modal.close("search-games");
                setExpanded(["left"]);
              },
            },
          ]}
        />
      </div>
      {isSearchActive &&
        (isSearching ? (
          <div className={styles.modal__empty}>
            <Loader type="pacman" />
          </div>
        ) : games?.length ? (
          <GamesCards games={games} />
        ) : (
          <div className={styles.modal__empty}>Games not found</div>
        ))}{" "}
      {showMoreGamesButton && (
        <Link
          className={styles.modal__more}
          href={`/games?search=${encodeURIComponent(debouncedSearch)}`}
          onClick={() => modal.close()}
        >
          <Button>More games</Button>
        </Link>
      )}
    </div>
  );
};
