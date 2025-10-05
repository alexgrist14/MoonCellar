import { Input } from "../Input";
import styles from "./SearchModal.module.scss";
import { FC, useState } from "react";
import { gamesApi } from "../../api";
import { Button } from "../Button";
import { Loader } from "../Loader";
import { ButtonGroup } from "../Button/ButtonGroup";
import { modal } from "../Modal";
import { useDisableScroll } from "../../hooks";
import Link from "next/link";
import { SvgSearch } from "../svg";
import { useAsyncLoader } from "../../hooks/useAsyncLoader";
import { useDebouncedCallback } from "use-debounce";
import { useExpandStore } from "../../store/expand.store";
import { useAdvancedRouter } from "../../hooks/useAdvancedRouter";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { GamesCards } from "../GamesCards";
import { takeGames } from "../../constants/games.const";

export const SearchModal: FC = () => {
  const { sync, isLoading, setIsLoading } = useAsyncLoader();
  const { setExpanded } = useExpandStore();
  const { router } = useAdvancedRouter();

  const [games, setGames] = useState<IGameResponse[]>();
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);

  const debouncedSearch = useDebouncedCallback((search: string) => {
    sync(() =>
      gamesApi
        .getAll({
          search,
          take: takeGames,
        })
        .then((response) => {
          setGames(response.data.results);
          setTotal(response.data.total);
        })
    );
  }, 300);

  const searchHandler = (search: string) => {
    setSearchQuery(search);

    if (!search || search.length < 2) return;

    setIsSearchActive(true);
    setIsLoading(true);
    debouncedSearch(search);
  };

  useDisableScroll();

  return (
    <div className={styles.modal}>
      <div className={styles.modal__search}>
        <Input
          value={searchQuery}
          placeholder="Search..."
          autoFocus
          onChange={(e) => searchHandler(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              modal.close("search-games");
              router.push(`/games?search=${encodeURIComponent(searchQuery)}`);
            }
          }}
        />
        <ButtonGroup
          wrapperClassName={styles.modal__buttons}
          buttons={[
            {
              title: <SvgSearch style={{ width: "20px", marginTop: "2px" }} />,
              style: { padding: "2px 10px", height: "calc(100% - 10px)" },
              color: "accent",
              link: !!searchQuery
                ? `/games?search=${encodeURIComponent(searchQuery)}`
                : "/games",
              onClick: () => {
                modal.close("search-games");
              },
            },
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
      {isSearchActive && <GamesCards games={games} />}
      {!!games?.length && !!total && takeGames < total && (
        <Link
          className={styles.modal__more}
          href={`/games?search=${encodeURIComponent(searchQuery)}&page=2`}
          onClick={() => modal.close()}
        >
          <Button>More games</Button>
        </Link>
      )}
      {!games?.length && isSearchActive && (
        <div className={styles.modal__empty}>
          {isLoading ? <Loader type="pacman" /> : "Games not found"}
        </div>
      )}
    </div>
  );
};
