"use client";

import { FC, useEffect, useRef, useState } from "react";
import { ICustomList, IGameResponse } from "@mooncellar/schemas";
import {
  useAddListGameMutation,
  useCreateListMutation,
  useRemoveListGameMutation,
} from "@/src/lib/entities/list/api/list.mutations";
import { useUserListsQuery } from "@/src/lib/entities/list/api/list.queries";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Input } from "@/src/lib/shared/ui/Input";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { InlineCreateList } from "../InlineCreateList";
import { ListCheckRow } from "../ListCheckRow";
import styles from "./ListsPopover.module.scss";

const FILTER_THRESHOLD = 9;

interface IListsPanelProps {
  game: IGameResponse;
  userId: string;
  isTouch?: boolean;
}

export const ListsPanel: FC<IListsPanelProps> = ({ game, userId, isTouch }) => {
  const { data: lists, isLoading } = useUserListsQuery(userId, game._id);
  const { mutate: addGame } = useAddListGameMutation();
  const { mutate: removeGame } = useRemoveListGameMutation();
  const { mutateAsync: createList, isPending: isCreating } =
    useCreateListMutation();

  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const create = async (name: string) => {
    const list = await createList({ name, gameId: game._id });

    initialRef.current[list._id] = false;
    namesRef.current[list._id] = list.name;
    changesRef.current[list._id] = true;
    orderRef.current = [
      list._id,
      ...orderRef.current.filter((id) => id !== list._id),
    ];
    setOverrides((current) => ({ ...current, [list._id]: true }));
    setIsCreateOpen(false);
  };

  return (
    <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
      <p className={styles.panel__game}>{game.name}</p>
      {isLoading && <Loader isBlock />}
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
            <ListCheckRow
              key={list._id}
              name={list.name}
              count={getCount(list)}
              isChecked={isChecked(list)}
              isPrivate={list.isPrivate}
              isPending={pending[list._id]}
              isTouch={isTouch}
              onToggle={() => toggle(list)}
            />
          ))}
          {!visible.length && (
            <EmptyState
              variant="compact"
              isWithoutImage
              title={`No lists match “${filter}”`}
            />
          )}
        </Scrollbar>
      )}
      {!isLoading && !hasLists && (
        <EmptyState
          variant="compact"
          title="No lists yet"
          description="Name one after anything — a mood, a ranking, a plan for co-op nights."
        />
      )}
      {!isLoading && (
        <div className={styles.panel__footer}>
          <InlineCreateList
            isOpen={isCreateShown}
            isCreating={isCreating}
            hint={`${game.name} goes into the new list.`}
            onOpen={() => setIsCreateOpen(true)}
            onCancel={hasLists ? () => setIsCreateOpen(false) : undefined}
            onCreate={create}
          />
        </div>
      )}
    </div>
  );
};
