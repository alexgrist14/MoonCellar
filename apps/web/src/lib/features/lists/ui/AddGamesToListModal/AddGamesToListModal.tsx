"use client";

import { FC, useState } from "react";
import { isAxiosError } from "axios";
import {
  useAddListGamesMutation,
  useCreateListMutation,
} from "@/src/lib/entities/list/api/list.mutations";
import { useUserListsQuery } from "@/src/lib/entities/list/api/list.queries";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { modal } from "@/src/lib/shared/ui/Modal";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { InlineCreateList } from "../InlineCreateList";
import { ListCheckRow } from "../ListCheckRow";
import styles from "./AddGamesToListModal.module.scss";

export const ADD_GAMES_TO_LIST_MODAL_ID = "add-games-to-list";

interface IAddGamesToListModalProps {
  userId: string;
  gameIds: string[];
  onDone?: () => void;
}

const getErrorMessage = (error: unknown) =>
  (isAxiosError(error) ? error.response?.data?.message : undefined) ??
  "The games could not be added";

export const AddGamesToListModal: FC<IAddGamesToListModalProps> = ({
  userId,
  gameIds,
  onDone,
}) => {
  const { data: userLists, isLoading } = useUserListsQuery(userId);
  const lists = userLists?.filter((list) => !list.source);
  const { mutateAsync: addGames, isPending } = useAddListGamesMutation();
  const { mutateAsync: createList, isPending: isCreating } =
    useCreateListMutation();

  const [checked, setChecked] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const toggle = (id: string) =>
    setChecked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );

  const submit = async () => {
    try {
      for (const id of checked) {
        await addGames({ id, gameIds });
      }

      toast.success({
        description: `${gameIds.length} ${gameIds.length === 1 ? "game" : "games"} added to ${checked.length} ${checked.length === 1 ? "list" : "lists"}`,
      });
      modal.close(ADD_GAMES_TO_LIST_MODAL_ID);
      onDone?.();
    } catch (error) {
      toast.error({ description: getErrorMessage(error) });
    }
  };

  const create = async (name: string) => {
    const list = await createList({ name });

    setChecked((current) => [...current, list._id]);
    setIsCreateOpen(false);
  };

  return (
    <Box
      title={`Add ${gameIds.length} ${gameIds.length === 1 ? "game" : "games"} to`}
      isTitleStart
      className={styles.modal}
      contentStyle={{ padding: "var(--padding-x4)", gap: "var(--gap-x3)" }}
    >
      {isLoading ? (
        <Loader isBlock />
      ) : !lists?.length ? (
        <EmptyState
          variant="compact"
          title="You have no lists yet. Create one below."
        />
      ) : (
        <Scrollbar
          type="absolute"
          contentStyle={{ maxHeight: "var(--popover-max-height)" }}
        >
          <div className={styles.modal__list}>
            {lists.map((list) => (
              <ListCheckRow
                key={list._id}
                name={list.name}
                count={list.gamesCount}
                isPrivate={list.isPrivate}
                isChecked={checked.includes(list._id)}
                onToggle={() => toggle(list._id)}
              />
            ))}
          </div>
        </Scrollbar>
      )}

      <InlineCreateList
        isOpen={isCreateOpen}
        isCreating={isCreating}
        openLabel="Create a list"
        onOpen={() => setIsCreateOpen(true)}
        onCancel={() => setIsCreateOpen(false)}
        onCreate={create}
      />

      <Button
        color={ButtonColor.ACCENT}
        disabled={!checked.length || isPending}
        onClick={submit}
      >
        {isPending ? "Adding..." : "Add"}
      </Button>
    </Box>
  );
};
