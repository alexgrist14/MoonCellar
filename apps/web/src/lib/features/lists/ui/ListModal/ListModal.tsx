import { FC } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import z from "zod";
import {
  CUSTOM_LIST_DESCRIPTION_MAX,
  CUSTOM_LIST_NAME_MAX,
  CUSTOM_LIST_NAME_MIN,
  ICustomList,
} from "@mooncellar/schemas";
import {
  useCreateListMutation,
  useDeleteListMutation,
  useUpdateListMutation,
} from "@/src/lib/entities/list/api";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { Input } from "@/src/lib/shared/ui/Input";
import { getListHref } from "@/src/lib/shared/ui/ListCard";
import { modal } from "@/src/lib/shared/ui/Modal";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./ListModal.module.scss";

export const LIST_MODAL_ID = "custom-list-modal";
const DELETE_MODAL_ID = "custom-list-delete-modal";

const listFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      CUSTOM_LIST_NAME_MIN,
      `Name must be at least ${CUSTOM_LIST_NAME_MIN} characters.`
    )
    .max(
      CUSTOM_LIST_NAME_MAX,
      `Name must be at most ${CUSTOM_LIST_NAME_MAX} characters.`
    ),
  description: z
    .string()
    .max(
      CUSTOM_LIST_DESCRIPTION_MAX,
      `Description must be at most ${CUSTOM_LIST_DESCRIPTION_MAX} characters.`
    ),
  isPrivate: z.boolean(),
});

type IListForm = z.infer<typeof listFormSchema>;

interface IListModalProps {
  list?: ICustomList;
  userName: string;
  gameId?: string;
}

const getErrorMessage = (error: unknown) =>
  isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message
    : undefined;

export const ListModal: FC<IListModalProps> = ({ list, userName, gameId }) => {
  const router = useRouter();
  const isEdit = !!list;

  const { mutate: createList, isPending: isCreating } = useCreateListMutation();
  const { mutate: updateList, isPending: isUpdating } = useUpdateListMutation();
  const { mutateAsync: deleteList, isPending: isDeleting } =
    useDeleteListMutation();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid },
  } = useForm<IListForm>({
    resolver: zodResolver(listFormSchema),
    mode: "onChange",
    defaultValues: {
      name: list?.name ?? "",
      description: list?.description ?? "",
      isPrivate: list?.isPrivate ?? false,
    },
  });

  const onFailure = (error: unknown) => {
    const message = getErrorMessage(error);

    if (message) setError("name", { message });
  };

  const onSubmit: SubmitHandler<IListForm> = (data) => {
    const dto = {
      name: data.name.trim(),
      description: data.description.trim(),
      isPrivate: data.isPrivate,
    };

    if (list) {
      updateList(
        { id: list._id, dto },
        {
          onSuccess: (updated) => {
            modal.close(LIST_MODAL_ID);
            toast.success({ description: "List saved" });

            if (updated.slug !== list.slug) {
              router.replace(getListHref(updated));
            } else {
              router.refresh();
            }
          },
          onError: onFailure,
        }
      );

      return;
    }

    createList(
      { ...dto, ...(gameId ? { gameId } : {}) },
      {
        onSuccess: (created) => {
          modal.close(LIST_MODAL_ID);
          toast.success({ description: "List created" });

          if (!gameId) router.push(getListHref(created));
        },
        onError: onFailure,
      }
    );
  };

  const handleDelete = () => {
    if (!list) return;

    modal.open(
      <ConfirmModal
        title="Delete list"
        message={`Delete “${list.name}”? The ${list.gamesCount} ${commonUtils.addLastS("game", list.gamesCount)} stay in your categories and playthroughs; only the list goes.`}
        warning={
          list.isPrivate ? undefined : "Links to this list will stop working."
        }
        onCancel={() => modal.close(DELETE_MODAL_ID)}
        onConfirm={async () => {
          await deleteList({ id: list._id, userName, slug: list.slug });

          modal.close(DELETE_MODAL_ID);
          modal.close(LIST_MODAL_ID);
          toast.success({ description: "List deleted" });
          router.push(`/user/${userName}?list=lists`);
        }}
      />,
      { id: DELETE_MODAL_ID }
    );
  };

  const isBusy = isCreating || isUpdating || isDeleting;

  return (
    <Box contentStyle={{ padding: "var(--padding-x5)" }}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <h2 className={styles.title}>{isEdit ? "Edit list" : "New list"}</h2>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <label className={styles.field}>
              <span className={styles.field__head}>
                <span>Name</span>
                <span className={styles.counter}>
                  {field.value.length} / {CUSTOM_LIST_NAME_MAX}
                </span>
              </span>
              <Input
                {...field}
                autoFocus
                placeholder="Cozy winter evenings"
                error={errors.name}
                disabled={isBusy}
              />
            </label>
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <label className={styles.field}>
              <span className={styles.field__head}>
                <span>
                  Description <span className={styles.optional}>Optional</span>
                </span>
                <span className={styles.counter}>
                  {field.value.length} / {CUSTOM_LIST_DESCRIPTION_MAX}
                </span>
              </span>
              <Textarea
                {...field}
                rows={3}
                placeholder="What ties these games together?"
                error={errors.description}
                disabled={isBusy}
                classNameField={styles.textarea}
              />
            </label>
          )}
        />
        <Controller
          control={control}
          name="isPrivate"
          render={({ field }) => (
            <div className={styles.toggle}>
              <div className={styles.toggle__text}>
                <span>Private list</span>
                <span className={styles.hint}>
                  {isEdit && !list?.isPrivate
                    ? "Making it private hides it from your profile and breaks links already shared."
                    : "Only you can open it."}
                </span>
              </div>
              <ToggleSwitch
                value={field.value ? "right" : "left"}
                isDisabled={isBusy}
                clickCallback={(result) => field.onChange(result === "ON")}
              />
            </div>
          )}
        />
        <div className={styles.actions}>
          {isEdit && (
            <Button
              type="button"
              color={ButtonColor.RED}
              className={styles.actions__delete}
              onClick={handleDelete}
              disabled={isBusy}
            >
              Delete list
            </Button>
          )}
          <Button
            type="button"
            color={ButtonColor.DEFAULT}
            onClick={() => modal.close(LIST_MODAL_ID)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color={ButtonColor.ACCENT}
            disabled={!isValid || isBusy}
          >
            {isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Box>
  );
};

export const openListModal = (props: IListModalProps) =>
  modal.open(<ListModal {...props} />, { id: LIST_MODAL_ID });
