import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { gamesApi } from "@/src/lib/shared/api";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { IGameResponse, IGetGamesRequest } from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { Table } from "@/src/lib/shared/ui/Table";
import { ActionsMenu } from "@/src/lib/shared/ui/ActionsMenu";
import { ITableCell } from "@/src/lib/shared/types/table.type";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { modal } from "@/src/lib/shared/ui/Modal";
import styles from "./GameList.module.scss";
import { useGamesQuery } from "@/src/lib/entities/game/api/game.queries";
import {
  useDeleteGameMutation,
  useUpdateGameMutation,
} from "@/src/lib/entities/game/api/game.mutations";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";

const TAKE = 50;
const ON = "ON";
const OFF = "OFF";

const SORT_BY_MAP: Record<string, IGetGamesRequest["sortBy"]> = {
  name: "name",
  firstRelease: "first_release",
};

export const GameList: FC = () => {
  const router = useRouter();
  const { query, setQuery } = useAdvancedRouter();
  const page = Number(query.get("page")) || 1;

  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [sortBy, setSortBy] = useState<IGetGamesRequest["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const params = useMemo<IGetGamesRequest>(
    () => ({
      page,
      take: TAKE,
      search: search || undefined,
      sortBy,
      sortOrder,
    }),
    [page, search, sortBy, sortOrder]
  );

  const { data, isPending, isFetching } = useGamesQuery(params);
  const { mutate: updateGame } = useUpdateGameMutation();
  const { mutate: deleteGame } = useDeleteGameMutation();

  const games = data?.results ?? [];
  const total = data?.total ?? 0;

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setQuery({ page: 1 });
  }, 300);

  const handleSort = useCallback(
    (key: string, order: "asc" | "desc") => {
      const mappedSortBy = SORT_BY_MAP[key];

      if (!mappedSortBy) return;

      setSortBy(mappedSortBy);
      setSortOrder(order);
      setQuery({ page: 1 });
    },
    [setQuery]
  );

  const openEditor = useCallback(
    (gameId?: string) => {
      router.push(gameId ? `/admin/games/${gameId}` : "/admin/games/new");
    },
    [router]
  );

  const handleStopParsing = (game: IGameResponse, isStopParsing: boolean) => {
    updateGame({
      gameId: game._id,
      patch: { isStopParsing },
    });
  };

  const handleDelete = useCallback(
    (game: IGameResponse) => {
      const modalId = `delete-game-${game._id}`;

      modal.open(
        <ConfirmModal
          title="Delete Game"
          message={
            <p>
              Are you sure you want to delete <strong>{game.name}</strong>?
            </p>
          }
          onConfirm={() =>
            deleteGame(game._id, { onSuccess: () => modal.close(modalId) })
          }
          onCancel={() => modal.close(modalId)}
        />,
        // <div className={styles.confirmModal}>
        //   <h3>Delete Game</h3>
        //   <p>
        //     Are you sure you want to delete <strong>{game.name}</strong>?
        //   </p>
        //   <p className={styles.confirmModal__warning}>
        //     This permanently deletes the game.
        //   </p>
        //   <div className={styles.confirmModal__buttons}>
        //     <Button
        //       color={ButtonColor.DEFAULT}
        //       onClick={() => modal.close(modalId)}
        //     >
        //       Cancel
        //     </Button>
        //     <Button
        //       color={ButtonColor.RED}
        //       onClick={() =>
        //         deleteGame(game._id, { onSuccess: () => modal.close(modalId) })
        //       }
        //     >
        //       Delete
        //     </Button>
        //   </div>
        // </div>,
        { id: modalId }
      );
    },
    [deleteGame]
  );

  return (
    <div>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Input
            value={inputValue}
            placeholder="Search games"
            onChange={(e) => {
              setInputValue(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
        </div>
        <Button color={ButtonColor.GREEN} onClick={() => openEditor()}>
          Add game
        </Button>
      </div>

      <Table
        mobileHeadField="name"
        isLoading={isPending || isFetching}
        limit={TAKE}
        sortingCallback={handleSort}
        headers={{
          cover: { content: "Cover" },
          name: { content: "Name" },
          type: { content: "Type" },
          firstRelease: { content: "Released" },
          isStopParsing: { content: "Stop parsing" },
          actions: { content: "Actions" },
        }}
        rows={games.map((game) => {
          const cells: Record<string, ITableCell> = {
            cover: {
              content: game.cover ? (
                <Image
                  className={styles.cover}
                  src={game.cover}
                  width={48}
                  height={64}
                  alt={game.name}
                />
              ) : (
                "—"
              ),
            },
            name: {
              content: (
                <div className={styles.name}>
                  <span>{game.name}</span>
                  <span className={styles.slug}>{game.slug}</span>
                </div>
              ),
            },
            type: { content: game.type || "—" },
            firstRelease: {
              content: game.first_release
                ? new Date(game.first_release * 1000).getFullYear()
                : "—",
            },
            isStopParsing: {
              content: (
                <div onClick={(event) => event.stopPropagation()}>
                  <ToggleSwitch
                    leftContent={OFF}
                    rightContent={ON}
                    value={game.isStopParsing ? "right" : "left"}
                    clickCallback={(result) =>
                      handleStopParsing(game, result === ON)
                    }
                  />
                </div>
              ),
            },
            actions: {
              content: (
                <ActionsMenu
                  items={[
                    { label: "Edit", onClick: () => openEditor(game._id) },
                    {
                      label: "Open on the site",
                      onClick: () =>
                        window.open(`/games/${game.slug}`, "_blank"),
                    },
                    {
                      label: "Delete",
                      isDanger: true,
                      onClick: () => handleDelete(game),
                    },
                  ]}
                />
              ),
            },
          };

          return Object.fromEntries(
            Object.entries(cells).map(([key, cell]) => [
              key,
              ["isStopParsing", "actions"].includes(key)
                ? cell
                : {
                    ...cell,
                    className: styles.rowClickable,
                    onClick: () => openEditor(game._id),
                  },
            ])
          ) as Record<
            | "cover"
            | "name"
            | "type"
            | "firstRelease"
            | "isStopParsing"
            | "actions",
            ITableCell
          >;
        })}
      />

      <Pagination total={total} take={TAKE} isDisabled={isFetching} />
    </div>
  );
};
