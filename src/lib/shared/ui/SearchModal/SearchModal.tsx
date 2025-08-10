import { Input } from "../Input";
import styles from "./SearchModal.module.scss";
import { FC, useState } from "react";
import { gamesApi } from "../../api";
import { Scrollbar } from "../Scrollbar";
import { Button } from "../Button";
import { GameCard } from "../GameCard";
import classNames from "classnames";
import { Loader } from "../Loader";
import { ButtonGroup } from "../Button/ButtonGroup";
import { modal } from "../Modal";
import { useDisableScroll, useWindowResizeAction } from "../../hooks";
import Link from "next/link";
import { screenGt, screenLg, screenMd, screenSm } from "../../constants";
import { SvgSearch } from "../svg";
import { useAsyncLoader } from "../../hooks/useAsyncLoader";
import { useDebouncedCallback } from "use-debounce";
import { useExpandStore } from "../../store/expand.store";
import { useAdvancedRouter } from "../../hooks/useAdvancedRouter";
import { IGameResponse } from "../../lib/schemas/games.schema";

export const SearchModal: FC = () => {
  const { sync, isLoading, setIsLoading } = useAsyncLoader();
  const { setExpanded } = useExpandStore();
  const { router } = useAdvancedRouter();

  const [games, setGames] = useState<IGameResponse[]>();
  const [searchQuery, setSearchQuery] = useState("");
  const [take, setTake] = useState(17);
  const [total, setTotal] = useState<number>();
  const [isSearchActive, setIsSearchActive] = useState(false);

  const debouncedSearch = useDebouncedCallback((search: string) => {
    sync(() =>
      gamesApi
        .getAll({
          search,
          take,
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
          onChange={(e) => searchHandler(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              modal.close();
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
                modal.close();
              },
            },
            {
              title: "Advanced",
              link: !!searchQuery
                ? `/games?search=${encodeURIComponent(searchQuery)}`
                : "/games",
              onClick: () => {
                modal.close();
                setExpanded(["left"]);
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
