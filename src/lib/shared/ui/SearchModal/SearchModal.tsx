import { useDebouncedCallback } from "use-debounce";
import { Input } from "../Input";
import styles from "./SearchModal.module.scss";
import { FC, useEffect, useMemo, useState } from "react";
import { IGDBApi } from "../../api";
import { IGDBGame } from "../../types/igdb";
import { Scrollbar } from "../Scrollbar";
import { Button } from "../Button";
import { PacmanLoader, PulseLoader } from "react-spinners";
import { GameCard } from "../GameCard";
import classNames from "classnames";
import { useCommonStore } from "../../store/common.store";

export const SearchModal: FC = () => {
  const { isMobile } = useCommonStore();

  const [games, setGames] = useState<IGDBGame[]>([]);
  const [total, setTotal] = useState(0);

  const [take, setTake] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const isSearchActive = useMemo(
    () => !!searchQuery && searchQuery.length >= 2,
    [searchQuery]
  );

  const originalTake = 19;

  const debouncedSearch = useDebouncedCallback(() => {
    IGDBApi.getGames({
      search: searchQuery,
      take: take + Math.ceil(take / originalTake - 1),
    }).then((response) => {
      setGames(response.data.results);
      setTotal(response.data.total);
      setIsLoading(false);
    });
  }, 300);

  useEffect(() => {
    if (!take) return;

    if (isSearchActive) {
      setIsLoading(true);
      debouncedSearch();
    } else {
      setTimeout(() => setGames([]), 400);
    }
  }, [searchQuery, debouncedSearch, take, isSearchActive]);

  useEffect(() => {
    setTake(originalTake);
  }, [searchQuery, isMobile, originalTake]);

  return (
    <div className={styles.modal}>
      <div className={styles.modal__search}>
        <Input
          value={searchQuery}
          placeholder="Search..."
          autoFocus
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {!!games?.length && (
        <Scrollbar stl={styles} type="absolute">
          <div
            className={classNames(styles.modal__results, {
              [styles.modal__results_loading]: isLoading,
            })}
          >
            {games?.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
            {!!games?.length && take < total && (
              <Button
                className={styles.modal__more}
                onClick={() => setTake(take + originalTake)}
              >
                {isLoading ? <PulseLoader color="#ffffff" /> : "More games"}
              </Button>
            )}
          </div>
        </Scrollbar>
      )}
      {!games?.length && isSearchActive && (
        <div className={styles.modal__empty}>
          {isLoading ? (
            <PacmanLoader color="#ffffff" speedMultiplier={2} />
          ) : (
            "Games not found"
          )}
        </div>
      )}
    </div>
  );
};
