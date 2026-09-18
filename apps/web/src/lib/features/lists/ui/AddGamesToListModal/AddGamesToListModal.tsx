"use client";

import { FC, useState } from "react";
import { isAxiosError } from "axios";
import {
  CUSTOM_LIST_NAME_MAX,
  CUSTOM_LIST_NAME_MIN,
} from "@mooncellar/schemas";
import {
  useAddListGamesMutation,
  useCreateListMutation,
} from "@/src/lib/entities/list/api/list.mutations";
import { useUserListsQuery } from "@/src/lib/entities/list/api/list.queries";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { Input } from "@/src/lib/shared/ui/Input";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SvgPlus } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
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
  const { data: lists, isLoading } = useUserListsQuery(userId);
  const { mutateAsync: addGames, isPending } = useAddListGamesMutation();
  const { mutateAsync: createList, isPending: isCreating } =
    useCreateListMutation();

  const [checked, setChecked] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");

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

  const create = async () => {
    try {
      const list = await createList({ name: name.trim() });

      setChecked((current) => [...current, list._id]);
      setName("");
      setIsCreateOpen(false);
    } catch (error) {
      toast.error({ description: getErrorMessage(error) });
    }
  };

  return (
    <Box
      title={`Add ${gameIds.length} ${gameIds.length === 1 ? "game" : "games"} to`}
      isTitleStart
      className={styles.modal}
      contentStyle={{ padding: "var(--padding-x4)", gap: "var(--gap-x3)" }}
    >
      {isLoading ? (
        <Loader type="propogate" />
      ) : !lists?.length ? (
        <p className={styles.modal__empty}>
          You have no lists yet. Create one below.
        </p>
      ) : (
        <Scrollbar type="absolute" contentStyle={{ maxHeight: "260px" }}>
          <div className={styles.modal__list}>
            {lists.map((list) => (
              <label key={list._id} className={styles.modal__row}>
                <Checkbox
                  colorTheme="on"
                  checked={checked.includes(list._id)}
                  onChange={() => toggle(list._id)}
                />
                <span className={styles.modal__name}>{list.name}</span>
                <span className={styles.modal__count}>{list.gamesCount}</span>
              </label>
            ))}
          </div>
        </Scrollbar>
      )}

      {isCreateOpen ? (
        <div className={styles.modal__create}>
          <Input
            value={name}
            placeholder="List name"
            onChange={(event) => setName(event.target.value)}
          />
          <Button
            color={ButtonColor.ACCENT}
            disabled={
              isCreating ||
              name.trim().length < CUSTOM_LIST_NAME_MIN ||
              name.trim().length > CUSTOM_LIST_NAME_MAX
            }
            onClick={create}
          >
            Create
          </Button>
        </div>
      ) : (
        <Button
          color={ButtonColor.TRANSPARENT}
          className={styles.modal__createToggle}
          onClick={() => setIsCreateOpen(true)}
        >
          <SvgPlus size="16" />
          Create a list
        </Button>
      )}

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
