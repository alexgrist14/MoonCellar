"use client";

import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { isAxiosError } from "axios";
import {
  CUSTOM_LIST_NAME_MAX,
  CUSTOM_LIST_NAME_MIN,
  ICustomList,
  IGameResponse,
} from "@mooncellar/schemas";
import {
  useAddListGameMutation,
  useCreateListMutation,
  useRemoveListGameMutation,
} from "@/src/lib/entities/list/api/list.mutations";
import { useUserListsQuery } from "@/src/lib/entities/list/api/list.queries";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { Input } from "@/src/lib/shared/ui/Input";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { SvgLock, SvgPlus } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./ListsPopover.module.scss";

const FILTER_THRESHOLD = 9;

interface IListsPanelProps {
  game: IGameResponse;
  userId: string;
  isTouch?: boolean;
}

const getErrorMessage = (error: unknown) => {
  const message = isAxiosError(error)
    ? error.response?.data?.message
    : undefined;

  return typeof message === "string"
    ? message
    : "The list could not be created";
};

export const ListsPanel: FC<IListsPanelProps> = ({ game, userId, isTouch }) => {
  const { data: lists, isLoading } = useUserListsQuery(userId, game._id);
  const { mutate: addGame } = useAddListGameMutation();
  const { mutate: removeGame } = useRemoveListGameMutation();
  const { mutate: createList, isPending: isCreating } = useCreateListMutation();

  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string>();

  const orderRef = useRef<string[]>([]);
  const initialRef = useRef<Record<string, boolean>>({});
  const namesRef = useRef<Record<string, string>>({});
  const changesRef = useRef<Record<string, boolean>>({});

  if (lists) {
    const known = new Set(orderRef.current);
    const fresh = lists.filter((list) => !known.has(list._id));

    if (fresh.length) {
      orderRef.current = [
        ...fresh.map((list) => list._id),
        ...orderRef.current,
      ];
      fresh.forEach((list) => {
        initialRef.current[list._id] ??= !!list.containsGame;
      });
    }

    lists.forEach((list) => {
      namesRef.current[list._id] = list.name;
    });
  }

  useEffect(() => {
    const changes = changesRef;
    const names = namesRef;

    return () => {
      const entries = Object.entries(changes.current);

      if (!entries.length) return;

      if (entries.length === 1) {
        const [[listId, isAdded]] = entries;

        toast.success({
          title: `${isAdded ? "Added to" : "Removed from"} ${names.current[listId] ?? "list"}`,
          description: game.name,
        });
        return;
      }

      toast.success({
        title: `Updated ${entries.length} lists`,
        description: game.name,
      });
    };
  }, [game.name]);

  const ordered = orderRef.current
    .map((id) => lists?.find((list) => list._id === id))
    .filter((list): list is ICustomList => !!list);

  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? ordered.filter((list) => list.name.toLowerCase().includes(needle))
    : ordered;

  const isChecked = (list: ICustomList) =>
    overrides[list._id] ?? !!list.containsGame;

  const getCount = (list: ICustomList) => {
    const override = overrides[list._id];

    if (override === undefined || override === !!list.containsGame) {
      return list.gamesCount;
    }

    return Math.max(0, list.gamesCount + (override ? 1 : -1));
  };

  const record = (listId: string, isAdded: boolean) => {
    if (initialRef.current[listId] === isAdded) {
      delete changesRef.current[listId];
    } else {
      changesRef.current[listId] = isAdded;
    }
  };

  const setPendingFor = (listId: string, value: boolean) =>
    setPending((current) => ({ ...current, [listId]: value }));

  const toggle = (list: ICustomList) => {
    if (pending[list._id]) return;

    const next = !isChecked(list);
    const options = {
      onError: () => {
        setOverrides((current) => ({ ...current, [list._id]: !next }));
        record(list._id, !next);
      },
      onSettled: () => setPendingFor(list._id, false),
    };

    setOverrides((current) => ({ ...current, [list._id]: next }));
    setPendingFor(list._id, true);
    record(list._id, next);

    if (next) {
      addGame(
        { id: list._id, dto: { gameId: game._id, position: "end" } },
        options
      );
    } else {
      removeGame({ id: list._id, gameId: game._id }, options);
    }
  };

  const hasLists = !!lists?.length;
  const isCreateShown = isCreateOpen || (!isLoading && !hasLists);

  const resetCreate = () => {
    setIsCreateOpen(false);
    setName("");
    setCreateError(undefined);
  };

  const submitCreate = () => {
    const trimmed = name.trim();

    if (trimmed.length < CUSTOM_LIST_NAME_MIN) {
      setCreateError(
        `Name must be at least ${CUSTOM_LIST_NAME_MIN} characters`
      );
      return;
    }

    if (trimmed.length > CUSTOM_LIST_NAME_MAX) {
      setCreateError(`Name must be at most ${CUSTOM_LIST_NAME_MAX} characters`);
      return;
    }

    createList(
      { name: trimmed, gameId: game._id },
      {
        onSuccess: (list) => {
          initialRef.current[list._id] = false;
          namesRef.current[list._id] = list.name;
          changesRef.current[list._id] = true;
          orderRef.current = [
            list._id,
            ...orderRef.current.filter((id) => id !== list._id),
          ];
          setOverrides((current) => ({ ...current, [list._id]: true }));
          resetCreate();
        },
        onError: (error) => setCreateError(getErrorMessage(error)),
      }
    );
  };

  const handleCreateKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitCreate();
    }

    if (event.key === "Escape" && hasLists) {
      event.stopPropagation();
      resetCreate();
    }
  };

  return (
    <div
      className={classNames(styles.panel, { [styles.panel_touch]: isTouch })}
      onClick={(event) => event.stopPropagation()}
    >
      <p className={styles.panel__game}>{game.name}</p>
      {isLoading && (
        <div className={styles.loading}>
          <Loader />
        </div>
      )}
      {hasLists && ordered.length >= FILTER_THRESHOLD && (
        <Input
          value={filter}
          placeholder="Filter lists"
          onChange={(event) => setFilter(event.target.value)}
        />
      )}
      {hasLists && (
        <Scrollbar
          type="absolute"
          classNameContent={styles.panel__list}
          contentStyle={{ maxHeight: "var(--popover-max-height)" }}
        >
          {visible.map((list) => (
            <label
              key={list._id}
              className={classNames(styles.row, {
                [styles.row_pending]: pending[list._id],
              })}
            >
              <Checkbox
                checked={isChecked(list)}
                disabled={pending[list._id]}
                onChange={() => toggle(list)}
              />
              <span className={styles.row__name}>{list.name}</span>
              {list.isPrivate && (
                <SvgLock
                  size="12"
                  className={styles.row__lock}
                  style={{ color: "inherit" }}
                  aria-label="Private list"
                />
              )}
              <span className={styles.row__count}>{getCount(list)}</span>
            </label>
          ))}
          {!visible.length && (
            <p className={styles.panel__note}>No lists match “{filter}”</p>
          )}
        </Scrollbar>
      )}
      {!isLoading && !hasLists && (
        <div className={styles.empty}>
          <b>No lists yet</b>
          <span>
            Name one after anything — a mood, a ranking, a plan for co-op
            nights.
          </span>
        </div>
      )}
      {!isLoading && (
        <div className={styles.panel__footer}>
          {isCreateShown ? (
            <div className={styles.create}>
              <div className={styles.create__row}>
                <Input
                  autoFocus
                  value={name}
                  placeholder="New list name"
                  disabled={isCreating}
                  onChange={(event) => {
                    setName(event.target.value);
                    setCreateError(undefined);
                  }}
                  onKeyDown={handleCreateKeyDown}
                />
                <Button
                  color={ButtonColor.ACCENT}
                  disabled={isCreating || !name.trim()}
                  onClick={submitCreate}
                >
                  Create
                </Button>
              </div>
              <span
                className={classNames(styles.create__hint, {
                  [styles.create__hint_error]: !!createError,
                })}
              >
                {createError ?? `${game.name} goes into the new list.`}
              </span>
            </div>
          ) : (
            <Button
              color={ButtonColor.TRANSPARENT}
              className={styles.panel__new}
              onClick={() => setIsCreateOpen(true)}
            >
              <SvgPlus size="16" style={{ color: "inherit" }} />
              New list
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
