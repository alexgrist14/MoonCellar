import { FC, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { gamesApi } from "@/src/lib/shared/api";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import {
  IGameResponse,
  IGetGamesRequest,
} from "@/src/lib/shared/lib/schemas/games.schema";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { Table } from "@/src/lib/shared/ui/Table";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { modal } from "@/src/lib/shared/ui/Modal";
import styles from "./GameList.module.scss";

const TAKE = 50;
const ON = "ON";
const OFF = "OFF";

const SORT_BY_MAP: Record<string, IGetGamesRequest["sortBy"]> = {
  name: "name",
  firstRelease: "first_release",
};

const GameList: FC = () => {
  const router = useRouter();
  const { query, setQuery } = useAdvancedRouter();
  const page = Number(query.get("page")) || 1;

  const [games, setGames] = useState<IGameResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<IGetGamesRequest["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const requestIdRef = useRef(0);

  const fetchGames = useCallback(
    (
      nextPage: number,
      nextSearch: string,
      nextSortBy: IGetGamesRequest["sortBy"],
      nextSortOrder: "asc" | "desc"
    ) => {
      const requestId = ++requestIdRef.current;

      setIsLoading(true);

      gamesApi
        .getAll({
          page: nextPage,
          take: TAKE,
          search: nextSearch || undefined,
          sortBy: nextSortBy,
          sortOrder: nextSortOrder,
        })
        .then((res) => {
          if (requestId !== requestIdRef.current) return;

          setGames(res.data.results);
          setTotal(res.data.total);
        })
        .finally(() => {
          if (requestId !== requestIdRef.current) return;

          setIsLoading(false);
        });
    },
    []
  );

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value);
    setQuery({ page: 1 });
  }, 300);

  useEffect(() => {
    fetchGames(page, search, sortBy, sortOrder);
  }, [fetchGames, page, search, sortBy, sortOrder]);

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

  const handleStopParsing = useCallback(
    async (game: IGameResponse, next: boolean) => {
      const previous = game.isStopParsing;

      setGames((prev) =>
        prev.map((item) =>
          item._id === game._id ? { ...item, isStopParsing: next } : item
        )
      );

      try {
        await gamesApi.update(game._id, { isStopParsing: next });
      } catch {
        setGames((prev) =>
          prev.map((item) =>
            item._id === game._id ? { ...item, isStopParsing: previous } : item
          )
        );
      }
    },
    []
  );

  const handleDelete = useCallback((game: IGameResponse) => {
    const modalId = `delete-game-${game._id}`;

    modal.open(
      <div className={styles.confirmModal}>
        <h3>Delete Game</h3>
        <p>
          Are you sure you want to delete <strong>{game.name}</strong>?
        </p>
        <p className={styles.confirmModal__warning}>
          This permanently deletes the game.
        </p>
        <div className={styles.confirmModal__buttons}>
          <Button
            color={ButtonColor.DEFAULT}
            onClick={() => modal.close(modalId)}
          >
            Cancel
          </Button>
          <Button
            color={ButtonColor.RED}
            onClick={async () => {
              try {
                await gamesApi.remove(game._id);
                setGames((prev) =>
                  prev.filter((item) => item._id !== game._id)
                );
                modal.close(modalId);
              } catch {
                return;
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>,
      { id: modalId }
    );
  }, []);

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
        isLoading={isLoading}
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
              <Link
                href={`/game/${game.slug}`}
                target="_blank"
                className={styles.name}
              >
                <span>{game.name}</span>
                <span className={styles.slug}>{game.slug}</span>
              </Link>
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
              <div className={styles.actions}>
                <Button
                  color={ButtonColor.DEFAULT}
                  onClick={() => openEditor(game._id)}
                >
                  Edit
                </Button>
                <Button
                  color={ButtonColor.RED}
                  onClick={() => handleDelete(game)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        }))}
      />

      <Pagination
        total={total}
        take={TAKE}
        isDisabled={isLoading}
        callback={() => setIsLoading(true)}
      />
    </div>
  );
};

export default GameList;
