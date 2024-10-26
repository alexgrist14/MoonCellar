import { useDebouncedCallback } from "use-debounce";
import { Input } from "../Input";
import styles from "./SearchModal.module.scss";
import { FC, useEffect, useState } from "react";
import { IGDBApi } from "../../api";
import { IGDBGame } from "../../types/igdb";
import { Scrollbar } from "../Scrollbar";
import { Button } from "../Button";
import { PulseLoader } from "react-spinners";
import { GameCard } from "../GameCard";

export const SearchModal: FC = () => {
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [total, setTotal] = useState(0);

  const [take, setTake] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebouncedCallback(() => {
    IGDBApi.getGames({ search: searchQuery, take }).then((response) => {
      setGames(response.data.results);
      setTotal(response.data.total);
      setIsLoading(false);
    });
  }, 300);

  useEffect(() => {
    if (!!searchQuery && searchQuery.length >= 2) {
      setIsLoading(true);
      debouncedSearch();
    } else {
      setGames([]);
    }
  }, [searchQuery, debouncedSearch, take]);

  return (
    <div className={styles.modal}>
      <div className={styles.modal__search}>
        <Input
          value={searchQuery}
          autoFocus
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {!!games?.length && (
        <Scrollbar stl={styles}>
          {games.map((game, i) => (
            <GameCard key={i} game={game} />
          ))}
          {take < total && (
            <Button
              className={styles.modal__more}
              onClick={() => setTake(take + 20)}
            >
              {isLoading ? <PulseLoader color="#ffffff" /> : "More games"}
            </Button>
          )}
        </Scrollbar>
      )}
    </div>
  );
};
