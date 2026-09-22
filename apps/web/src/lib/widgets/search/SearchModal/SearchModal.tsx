import { FC, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import { useDebounce } from "use-debounce";
import { Input } from "@/src/lib/shared/ui/Input";
import { Button } from "@/src/lib/shared/ui/Button";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { modal } from "@/src/lib/shared/ui/Modal";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { GamesCards } from "@/src/lib/widgets/game/GamesCards";
import { ListCard } from "@/src/lib/shared/ui/ListCard";
import { SvgGames, SvgListBullet, SvgProfile } from "@/src/lib/shared/ui/svg";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { ISearchTab, useSearchStore } from "@/src/lib/shared/store/search.store";
import { takeGames } from "@/src/lib/shared/constants/games.const";
import { SearchUsers } from "./SearchUsers";
import {
  ISearchCount,
  SEARCH_LISTS_PREVIEW,
  useSearchResults,
} from "./useSearchResults";
import styles from "./SearchModal.module.scss";

const MODAL_ID = "search-games";

const TABS: {
  key: ISearchTab;
  label: string;
  icon: ReactNode;
  noun: string;
  hint: string;
}[] = [
  {
    key: "games",
    label: "Games",
    icon: <SvgGames size="16" />,
    noun: "game",
    hint: "Type at least 2 characters of a game name.",
  },
  {
    key: "users",
    label: "Users",
    icon: <SvgProfile size="16" />,
    noun: "user",
    hint: "Type at least 2 characters of a user name.",
  },
  {
    key: "lists",
    label: "Lists",
    icon: <SvgListBullet size="16" />,
    noun: "list",
    hint: "Type at least 2 characters of a list name.",
  },
];

const EMPTY_TITLES: Record<ISearchTab, (query: string) => string> = {
  games: (query) => `No games match “${query}”`,
  users: (query) => `No users named “${query}”`,
  lists: (query) => `No lists match “${query}”`,
};

const pluralize = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`;

const renderCount = (count: ISearchCount, isReady: boolean) => {
  if (!isReady) return null;

  if (count.isPending) {
    return <span className={styles.tab__pending} aria-label="Loading" />;
  }

  return <span className={styles.tab__count}>{count.value ?? 0}</span>;
};

export const SearchModal: FC = () => {
  const { setExpanded } = useExpandStore();
  const { asPath } = useAdvancedRouter();

  const tab = useSearchStore((s) => s.tab);
  const setTab = useSearchStore((s) => s.setTab);

  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearch = searchQuery.trim();
  const [debouncedSearch] = useDebounce(normalizedSearch, 500);

  const isSearchActive = normalizedSearch.length >= 2;
  const isDebouncing = normalizedSearch !== debouncedSearch;

  const { isReady, games, users, lists, counts } = useSearchResults(
    debouncedSearch,
    isDebouncing
  );

  const activeCount = counts[tab];
  const isSearching = useMinimumLoading(
    isSearchActive && (isDebouncing || activeCount.isPending)
  );

  useEffect(() => {
    isSearchActive && modal.close(MODAL_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asPath]);

  const closeModal = () => modal.close(MODAL_ID);

  const encodedSearch = encodeURIComponent(searchQuery.trim());
  const gamesResults = games.data?.results;
  const gamesTotal = games.data?.total ?? 0;
  const usersResults = users.data?.pages.flatMap((page) => page.results) ?? [];
  const listsResults = lists.data?.results ?? [];
  const listsTotal = lists.data?.total ?? 0;

  const activeResultsCount =
    tab === "games"
      ? (gamesResults?.length ?? 0)
      : tab === "users"
        ? usersResults.length
        : listsResults.length;

  const otherMatches = TABS.filter(
    ({ key }) => key !== tab && !!counts[key].value
  );

  const advancedLink =
    tab === "games"
      ? !!searchQuery
        ? `/games?search=${encodedSearch}`
        : "/games"
      : tab === "lists"
        ? !!searchQuery
          ? `/lists?search=${encodedSearch}`
          : "/lists"
        : undefined;

  const renderEmpty = () => (
    <div className={styles.modal__empty}>
      <p className={styles.modal__emptyTitle}>
        {EMPTY_TITLES[tab](debouncedSearch)}
      </p>
      {!!otherMatches.length && (
        <p className={styles.modal__emptyText}>
          Found{" "}
          {otherMatches.map(({ key, noun }, i) => (
            <span key={key}>
              {i > 0 && " and "}
              <button
                type="button"
                className={styles.modal__switch}
                onClick={() => setTab(key)}
              >
                {pluralize(counts[key].value ?? 0, noun)}
              </button>
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );

  const renderResults = () => {
    if (!isSearchActive) {
      return (
        <p className={styles.modal__hint}>
          {TABS.find(({ key }) => key === tab)?.hint}
        </p>
      );
    }

    if (isSearching) {
      return (
        <div className={styles.modal__empty}>
          <Loader type="pacman" />
        </div>
      );
    }

    if (!activeResultsCount) return renderEmpty();

    if (tab === "games") {
      return <GamesCards games={gamesResults} columns={4} />;
    }

    return (
      <div className={styles.results}>
        <Scrollbar
          type="absolute"
          classNameContainer={styles.results__container}
          classNameContent={styles.results__content}
          contentStyle={{ maxHeight: "100%" }}
        >
          {tab === "users" ? (
            <SearchUsers
              users={usersResults}
              query={debouncedSearch}
              hasMore={!!users.hasNextPage}
              isFetchingMore={users.isFetchingNextPage}
              onMore={() => users.fetchNextPage()}
              onNavigate={closeModal}
            />
          ) : (
            <div className={styles.lists}>
              {listsResults.map((list) => (
                <ListCard
                  key={list._id}
                  list={list}
                  layout="row"
                  query={debouncedSearch}
                  onClick={closeModal}
                />
              ))}
            </div>
          )}
        </Scrollbar>
      </div>
    );
  };

  const encodedDebounced = encodeURIComponent(debouncedSearch);
  const isMoreShown = !isSearching && isSearchActive;
  const moreLink =
    isMoreShown && tab === "games" && takeGames < gamesTotal
      ? { href: `/games?search=${encodedDebounced}`, title: "More games" }
      : isMoreShown && tab === "lists" && SEARCH_LISTS_PREVIEW < listsTotal
        ? { href: `/lists?search=${encodedDebounced}`, title: "More lists" }
        : undefined;

  return (
    <div
      className={classNames(styles.modal, {
        [styles.modal_active]: isSearchActive,
      })}
    >
      <div className={styles.modal__search}>
        <Input
          value={searchQuery}
          placeholder="Search games, users and lists"
          autoFocus
          containerClassname={classNames({
            [styles.modal__input_withButton]: !!advancedLink,
          })}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {!!advancedLink && (
          <ButtonGroup
            wrapperClassName={styles.modal__buttons}
            buttons={[
              {
                title: "Advanced",
                link: advancedLink,
                onClick: () => {
                  closeModal();
                  setExpanded(["left"]);
                },
              },
            ]}
          />
        )}
      </div>
      <Tabs
        isUseDefaultIndex
        defaultTabIndex={TABS.findIndex(({ key }) => key === tab)}
        buttonsClassName={styles.tabs}
        contents={TABS.map(({ key, label, icon }) => ({
          tabName: "",
          className: classNames(styles.tab, {
            [styles.tab_empty]:
              isReady && !counts[key].isPending && counts[key].value === 0,
          }),
          tabNameNode: (
            <span className={styles.tab__label}>
              <span className={styles.tab__icon}>{icon}</span>
              {label}
              {renderCount(counts[key], isReady && isSearchActive)}
            </span>
          ),
          onTabClick: () => setTab(key),
        }))}
      />
      {renderResults()}
      {!!moreLink && (
        <Link
          className={styles.modal__more}
          href={moreLink.href}
          onClick={closeModal}
        >
          <Button>{moreLink.title}</Button>
        </Link>
      )}
    </div>
  );
};
