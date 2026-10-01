import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { gamesApi } from "@/src/lib/shared/api";
import { IGameResponse, IGetGamesRequest } from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { Table } from "@/src/lib/shared/ui/Table";
import { ActionsMenu } from "@/src/lib/shared/ui/ActionsMenu";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { modal } from "@/src/lib/shared/ui/Modal";
import styles from "./GameList.module.scss";
import { useGamesQuery } from "@/src/lib/entities/game/api/game.queries";
import {
  useDeleteGameMutation,
  useUpdateGameMutation,
} from "@/src/lib/entities/game/api/game.mutations";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";

const TAKE = 50;
const ON = "ON";
const OFF = "OFF";

const SORT_BY_MAP: Record<string, IGetGamesRequest["sortBy"]> = {
  name: "name",
  firstRelease: "first_release",
};

const resetPage = () => {
  const url = new URL(window.location.href);

  url.searchParams.delete("page");
  window.history.pushState(null, "", url);
};

export const GameList: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

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
    resetPage();
  }, 300);

  const handleSort = useCallback((key: string, order: "asc" | "desc") => {
    const mappedSortBy = SORT_BY_MAP[key];

    if (!mappedSortBy) return;

    setSortBy(mappedSortBy);
    setSortOrder(order);
    resetPage();
  }, []);

  const getEditorHref = (gameId: string) => `/admin/games/${gameId}`;

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
        <Button color={ButtonColor.GREEN} href="/admin/games/new">
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
        onRowClick={(index) => router.push(getEditorHref(games[index]._id))}
        rowClickExcludeKeys={["isStopParsing", "actions"]}
        rows={games.map((game) => ({
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
              <ToggleSwitch
                leftContent={OFF}
                rightContent={ON}
                value={game.isStopParsing ? "right" : "left"}
                clickCallback={(result) =>
                  handleStopParsing(game, result === ON)
                }
              />
            ),
          },
          actions: {
            content: (
              <ActionsMenu
                items={[
                  { label: "Edit", href: getEditorHref(game._id) },
                  {
                    label: "Open on the site",
                    onClick: () => window.open(`/games/${game.slug}`, "_blank"),
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
        }))}
      />

      <Pagination total={total} take={TAKE} isDisabled={isFetching} />
    </div>
  );
};
