import { FC, useRef, useState } from "react";
import { GAUNTLET_HISTORY_TAKE, IGameResponse } from "@mooncellar/schemas";
import { useGauntletHistoryPageQuery } from "@/src/lib/entities/gauntlet-history/api/gauntlet-history.queries";
import { useGauntletHistory } from "@/src/lib/entities/gauntlet-history/model/useGauntletHistory";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { GamesList } from "@/src/lib/widgets/game/GamesList";
import styles from "./ConsolesList.module.scss";

export const GauntletHistoryList: FC = () => {
  const listRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const { userId, guestGames = [], removeGame, clear } = useGauntletHistory();
  const { data, isLoading, isFetching } = useGauntletHistoryPageQuery(
    userId,
    page
  );

  const total = userId ? (data?.total ?? 0) : guestGames.length;
  const games = userId
    ? (data?.results ?? [])
    : guestGames.slice(
        (page - 1) * GAUNTLET_HISTORY_TAKE,
        page * GAUNTLET_HISTORY_TAKE
      );

  const remove = (game: IGameResponse) => {
    if (games.length === 1 && page > 1) setPage(page - 1);
    removeGame(game);
  };

  const removeAll = () => {
    setPage(1);
    clear();
  };

  if (isLoading) return <GamesList games={[]} isLoading />;

  return (
    <div ref={listRef} className={styles.consoles__list}>
      <GamesList games={games} getGames={removeAll} removeGame={remove} />
      <Pagination
        total={total}
        take={GAUNTLET_HISTORY_TAKE}
        page={page}
        onPageChange={setPage}
        isDisabled={isFetching}
        isWithoutSummary
        scrollTargetRef={listRef}
      />
    </div>
  );
};
