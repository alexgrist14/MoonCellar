import { FC, useCallback, useEffect, useState } from "react";
import styles from "./PlaythroughModal.module.scss";
import { Dropdown } from "../Dropdown";
import { ButtonGroup } from "../Button/ButtonGroup";
import { Textarea } from "../Textarea";
import { Input } from "../Input";
import { ToggleSwitch } from "../ToggleSwitch";
import { commonUtils } from "../../utils/common.utils";
import { useAuthStore } from "../../store/auth.store";
import {
  IPlaythrough,
  IPlaythroughMinimal,
  ISavePlaythroughRequest,
  SavePlaythroughRequestSchema,
} from "../../lib/schemas/playthroughs.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAsyncLoader } from "../../hooks/useAsyncLoader";
import { Loader } from "../Loader";
import { Errors } from "../Errors";
import { IButtonGroupItem } from "../../types/buttons.type";
import { SvgPlus } from "../svg";
import classNames from "classnames";
import { useUserStore } from "../../store/user.store";
import { WrapperTemplate } from "../WrapperTemplate";
import { toast } from "../../utils/toast.utils";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { playthroughsAPI } from "../../api";
import { useCommonStore } from "../../store/common.store";

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

export const PlaythroughModal: FC<IPlaythroughModalProps> = ({
  game,
  userId,
}) => {
  const { profile } = useAuthStore();
  const { systems } = useCommonStore();
  const {
    setPlaythroughs: setStorePlaythroughs,
    playthroughs: storePlaythroughs,
  } = useUserStore();
  const { sync, isLoading } = useAsyncLoader();

  const [playthroughs, setPlaythroughs] = useState<IPlaythrough[]>([]);
  const [playthroughId, setPlaythroughId] = useState<string>();

  const {
    register,
    setValue,
    reset,
    watch,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ISavePlaythroughRequest>({
    mode: "all",
    resolver: zodResolver(SavePlaythroughRequestSchema),
  });

  const addHandler = useCallback(() => {
    setPlaythroughId(undefined);

    reset({
      userId,
      gameId: game._id,
      category: "wishlist",
    });
  }, [game, reset, userId]);

  const selectHandler = useCallback(
    (playthrough: IPlaythrough) => {
      const { _id, ...play } = playthrough;

      setPlaythroughId(_id);

      reset(play);
    },
    [reset]
  );

  const saveHandler = (data: ISavePlaythroughRequest) => {
    if (!profile) return;

    !!playthroughId
      ? sync(() =>
          playthroughsAPI
            .update(profile._id, playthroughId, data)
            .then((res) => {
              setPlaythroughs(
                playthroughs.map((play) =>
                  play._id === playthroughId ? res.data : play
                )
              );
              setStorePlaythroughs(
                storePlaythroughs?.map((play) =>
                  play._id === playthroughId
                    ? {
                        _id: res.data._id,
                        category: res.data.category,
                        isMastered: res.data.isMastered,
                        gameId: res.data.gameId,
                        updatedAt: res.data.updatedAt,
                      }
                    : play
                ) || []
              );
              selectHandler(res.data);
              toast.success({
                description: "Playthrough successfully updated",
              });
            })
        )
      : sync(() =>
          playthroughsAPI.create(data).then((res) => {
            setPlaythroughs([...playthroughs, res.data]);
            setStorePlaythroughs([
              ...(storePlaythroughs || []),
              {
                _id: res.data._id,
                category: res.data.category,
                isMastered: res.data.isMastered,
                gameId: res.data.gameId,
                updatedAt: res.data.updatedAt,
              },
            ]);
            selectHandler(res.data);
            toast.success({ description: "Playthrough successfully created" });
          })
        );
  };

  const deleteHandler = () => {
    if (!profile || !playthroughId) return;

    sync(() =>
      playthroughsAPI.remove(profile._id, playthroughId).then((res) => {
        setPlaythroughs(
          playthroughs.filter((play) => play._id !== res.data._id)
        );
        setStorePlaythroughs(
          storePlaythroughs?.filter((play) => play._id !== res.data._id) || []
        );

        setPlaythroughId(undefined);
        reset({ userId, gameId: game._id, category: "wishlist" });

        toast.success({ description: "Playthrough successfully removed" });
      })
    );
  };

  useEffect(() => {
    sync(() =>
      playthroughsAPI.getAll({ userId, gameId: game._id }).then((res) => {
        setPlaythroughs(res.data);
        !!res.data?.[res.data.length - 1]
          ? selectHandler(res.data[res.data.length - 1])
          : addHandler();
      })
    );
  }, [game, userId, selectHandler, addHandler, sync]);

  return (
    <WrapperTemplate isWithScrollBar contentStyle={{ padding: "20px" }}>
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
                      color: "fancy",
                      active: play._id === playthroughId,
                    }) as IButtonGroupItem
                ),
                {
                  title: "New",
                  color: "fancy",
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
                  color: "accent",
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
            getIndex={(index) =>
              setValue("category", playthroughCategories[index])
            }
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
              {watch("category") === "completed" && (
                <Input {...register("date")} placeholder="Date" type="date" />
              )}
              <Input
                placeholder="Game time (hours)"
                {...register("time")}
                value={watch("time") || ""}
              />
              {watch("category") === "completed" && (
                <ToggleSwitch
                  label="Mastered?"
                  leftContent="No"
                  rightContent="Yes"
                  value={watch("isMastered") ? "right" : "left"}
                  clickCallback={() =>
                    setValue("isMastered", !watch("isMastered"))
                  }
                />
              )}
            </div>
          )}
          <Textarea
            {...register("comment")}
            placeholder="Comment... (visible only to you)"
            className={styles.modal__comment}
            isDisableAutoResize
          />
          <div className={styles.modal__controls}>
            <ButtonGroup
              buttons={[
                {
                  title: "Save",
                  color: "green",
                  type: "submit",
                  disabled: !isValid,
                },
                {
                  title: "Delete",
                  color: "red",
                  onClick: deleteHandler,
                  type: "button",
                  hidden: !playthroughId,
                },
              ]}
            />
          </div>
        </form>
      </div>
    </WrapperTemplate>
  );
};
