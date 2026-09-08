import { FC, useCallback, useEffect, useState } from "react";
import styles from "./PlaythroughModal.module.scss";
import { Dropdown } from "../Dropdown";
import { ButtonGroup } from "../Button/ButtonGroup";
import { ButtonColor } from "../Button";
import { Textarea } from "../Textarea";
import { Input } from "../Input";
import { DatePicker } from "../DatePicker";
import { ToggleSwitch } from "../ToggleSwitch";
import { commonUtils } from "../../utils/common.utils";
import { useAuthStore } from "../../store/auth.store";
import {
  IPlaythrough,
  IPlaythroughMinimal,
  ISavePlaythroughRequest,
  ISavePlaythroughRequestInput,
  SavePlaythroughRequestSchema,
} from "../../lib/schemas/playthroughs.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "../Loader";
import { Errors } from "../Errors";
import { IButtonGroupItem } from "../../types/buttons.type";
import { SvgPlus } from "../svg";
import classNames from "classnames";
import { Box } from "../Box";
import { toast } from "../../utils/toast.utils";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { useCommonStore } from "../../store/common.store";
import { usePlaythroughsQuery } from "@/src/lib/entities/playthrough/api/playthrough.queries";
import {
  useCreatePlaythroughMutation,
  useUpdatePlaythroughMutation,
  useDeletePlaythroughMutation,
} from "@/src/lib/entities/playthrough/api/playthrough.mutations";

interface IPlaythroughModalProps {
  userId: string;
  game: IGameResponse;
}

const playthroughCategories: IPlaythroughMinimal["category"][] = [
  "wishlist",
  "playing",
  "completed",
  "played",
  "backlog",
  "dropped",
];

const categoriesWithDate: IPlaythroughMinimal["category"][] = ["completed"];

export const PlaythroughModal: FC<IPlaythroughModalProps> = ({
  game,
  userId,
}) => {
  const { profile } = useAuthStore();
  const { systems } = useCommonStore();

  const [playthroughId, setPlaythroughId] = useState<string>();

  const {
    register,
    setValue,
    reset,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ISavePlaythroughRequestInput, unknown, ISavePlaythroughRequest>({
    mode: "all",
    resolver: zodResolver(SavePlaythroughRequestSchema),
  });

  const { data: playthroughs = [], isPending } = usePlaythroughsQuery(
    userId,
    game._id
  );
  const { mutate: createPlaythrough, isPending: isCreating } =
    useCreatePlaythroughMutation();
  const { mutate: updatePlaythrough, isPending: isUpdating } =
    useUpdatePlaythroughMutation();
  const { mutate: deletePlaythrough, isPending: isDeleting } =
    useDeletePlaythroughMutation();

  const getFormValues = useCallback(
    (playthrough?: IPlaythrough): ISavePlaythroughRequestInput => ({
      userId,
      gameId: game._id,
      category: playthrough?.category || "wishlist",
      platformId: playthrough?.platformId,
      date: playthrough?.date || undefined,
      time: playthrough?.time,
      comment: playthrough?.comment || "",
      isMastered: playthrough?.isMastered || false,
    }),
    [game._id, userId]
  );

  const addHandler = useCallback(() => {
    setPlaythroughId(undefined);

    reset(getFormValues());
  }, [getFormValues, reset]);

  const selectHandler = useCallback(
    (playthrough: IPlaythrough) => {
      setPlaythroughId(playthrough._id);

      reset(getFormValues(playthrough));
    },
    [getFormValues, reset]
  );

  const saveHandler = (data: ISavePlaythroughRequest) => {
    if (!profile) return;
    if (playthroughId) {
      updatePlaythrough(
        { userId: profile._id, playthroughId, playthrough: data },
        {
          onSuccess: (playthrough) => {
            selectHandler(playthrough);
            toast.success({ description: "Playthrough successfully updated" });
          },
        }
      );
      return;
    }
    createPlaythrough(data, {
      onSuccess: (playthrough) => {
        selectHandler(playthrough);
        toast.success({ description: "Playthrough successfully created" });
      },
    });
  };

  const categoryHandler = (index: number) => {
    const category = playthroughCategories[index];

    setValue("category", category, { shouldValidate: true });

    if (categoriesWithDate.includes(category) && !watch("date")) {
      setValue("date", commonUtils.formatDate(new Date(), { isISO: true }), {
        shouldValidate: true,
      });
    }
  };

  const deleteHandler = () => {
    if (!profile || !playthroughId) return;

    deletePlaythrough(
      { userId: profile._id, playthroughId },
      {
        onSuccess: () => {
          setPlaythroughId(undefined);
          reset(getFormValues());
          toast.success({ description: "Playthrough successfully removed" });
        },
      }
    );
  };

  useEffect(() => {
    if (isPending) return;

    const last = playthroughs.at(-1);
    last ? selectHandler(last) : addHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, game._id, isPending]);

  const isLoading = isPending || isCreating || isUpdating || isDeleting;

  return (
    <Box
      isWithScrollBar
      contentStyle={{ padding: "var(--padding-x5)" }}
      classNameContent={styles.wrapper}
    >
      <div className={styles.modal}>
        {!!playthroughs?.length && (
          <div className={styles.modal__top}>
            <ButtonGroup
              buttons={[
                ...playthroughs.map(
                  (play) =>
                    ({
                      title: commonUtils.upFL(play?.category),
                      onClick: () => selectHandler(play),
                      color: ButtonColor.FANCY,
                      active: play._id === playthroughId,
                    }) as IButtonGroupItem
                ),
                {
                  title: "New",
                  color: ButtonColor.FANCY,
                  active: !!watch("category") && !playthroughId,
                  hidden: !watch("category") || !!playthroughId,
                },
              ]}
            />
            <ButtonGroup
              buttons={[
                {
                  title: <SvgPlus />,
                  onClick: addHandler,
                  color: ButtonColor.ACCENT,
                  hidden: !playthroughId,
                  compact: true,
                },
              ]}
            />
          </div>
        )}
        {isLoading && <Loader type="pacman" />}
        <form
          className={classNames(styles.modal__bottom, {
            [styles.modal__bottom_active]: !isLoading,
          })}
          onSubmit={handleSubmit(saveHandler)}
        >
          <Errors
            errors={
              !!errors
                ? Object.keys(errors).map((key) => ({
                    title: commonUtils.upFL(key),
                    description:
                      errors[key as keyof ISavePlaythroughRequest]?.message,
                  }))
                : []
            }
          />
          <Dropdown
            placeholder="Select category..."
            getIndex={categoryHandler}
            overwriteValue={commonUtils.upFL(watch("category") || "")}
            list={playthroughCategories.map((item) => commonUtils.upFL(item))}
          />
          <Dropdown
            placeholder="Select platform..."
            getIndex={(index) =>
              setValue("platformId", game.platformIds[index])
            }
            overwriteValue={
              systems?.find((item) => item._id === watch("platformId"))?.name ||
              ""
            }
            list={
              systems
                ?.filter((sys) => game.platformIds.includes(sys._id))
                .map((item) => item.name) || []
            }
          />
          {["completed", "played", "dropped"].includes(watch("category")) && (
            <div className={styles.modal__inputs}>
              {categoriesWithDate.includes(watch("category")) && (
                <DatePicker
                  value={watch("date") || ""}
                  onChange={(value) =>
                    setValue("date", value, { shouldValidate: true })
                  }
                />
              )}
              <Input
                placeholder="Game time (hours)"
                {...register("time", {
                  setValueAs: (value) =>
                    value === "" || value == null ? undefined : Number(value),
                })}
                value={watch("time") || ""}
              />
            </div>
          )}
          {watch("category") === "completed" && (
            <ToggleSwitch
              label="Mastered?"
              leftContent="No"
              rightContent="Yes"
              value={watch("isMastered") ? "right" : "left"}
              clickCallback={() => setValue("isMastered", !watch("isMastered"))}
            />
          )}
          <Textarea
            {...register("comment")}
            placeholder="Enter comment..."
            className={styles.modal__comment}
            isDisableAutoResize
          />
          <div className={styles.modal__controls}>
            <ButtonGroup
              buttons={[
                {
                  title: "Save",
                  color: ButtonColor.GREEN,
                  type: "submit",
                  disabled: !isValid,
                },
                {
                  title: "Delete",
                  color: ButtonColor.RED,
                  onClick: deleteHandler,
                  type: "button",
                  hidden: !playthroughId,
                },
              ]}
            />
          </div>
        </form>
      </div>
    </Box>
  );
};
