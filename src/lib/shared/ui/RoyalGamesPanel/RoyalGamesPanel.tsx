"use client";

import { FC, useState } from "react";
import styles from "./RoyalGamesPanel.module.scss";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { GamesList } from "@/src/lib/shared/ui/GamesList";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { ButtonColor } from "@/src/lib/shared/ui/Button";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SaveForm } from "@/src/lib/shared/ui/SaveForm";
import { useUserPresetsQuery } from "@/src/lib/entities/user/api/user.queries";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import {
  useAddUserPresetMutation,
  useRemoveUserPresetMutation,
} from "@/src/lib/entities/user/api/user.mutations";

export const RoyalGamesPanel: FC = () => {
  const { royalGames, setRoyalGames, removeRoyalGame } = useGamesStore();
  const { profile, isAuth } = useAuthStore();

  const [tabIndex, setTabIndex] = useState(0);

  const { data: royalGamesData, isLoading: isRoyalGamesLoading } =
    useGamesByIdsQuery(royalGames || []);
  const { data: savedPresets } = useUserPresetsQuery(profile?._id ?? "");
  const { mutate: addPreset } = useAddUserPresetMutation();
  const { mutate: removePreset } = useRemoveUserPresetMutation();

  return (
    <div className={styles.royal}>
      <Tabs
        defaultTabIndex={tabIndex}
        contents={[
          {
            tabName: "List",
            onTabClick: () => {
              setTabIndex(0);
            },
          },
          ...(isAuth
            ? [
                {
                  tabName: "Saved",
                  onTabClick: () => {
                    setTabIndex(1);
                  },
                },
              ]
            : []),
        ]}
      />
      {tabIndex === 0 &&
        (!!royalGames?.length && isRoyalGamesLoading ? (
          <Loader type="propogate" />
        ) : (
          <GamesList
            games={royalGamesData || []}
            getGames={(games) =>
              setRoyalGames(games.map((game) => game._id))
            }
            removeGame={(game) => removeRoyalGame(game._id)}
            saveCallback={
              isAuth
                ? () =>
                    modal.open(
                      <SaveForm
                        saveCallback={(name) => {
                          !!profile &&
                            !!royalGames?.length &&
                            addPreset(
                              {
                                userId: profile._id,
                                preset: {
                                  name,
                                  preset: royalGames,
                                },
                              },
                              {
                                onSuccess: () => {
                                  toast.success({
                                    description:
                                      "Preset was successfully saved",
                                  });
                                  modal.close();
                                },
                              }
                            );
                        }}
                      />
                    )
                : undefined
            }
          />
        ))}
      {isAuth && tabIndex === 1 && (
        <>
          {!!savedPresets ? (
            <div className={styles.royal__saved}>
              {!!savedPresets?.length ? (
                savedPresets.map((preset, i) => (
                  <ButtonGroup
                    key={i}
                    wrapperStyle={{
                      padding: "0",
                      display: "grid",
                      gridTemplateColumns: "1fr 20%",
                      width: "100%",
                    }}
                    buttons={[
                      {
                        title: preset.name,
                        color: ButtonColor.FANCY,
                        style: { textAlign: "start" },
                        compact: true,
                        onClick: () => {
                          setRoyalGames(preset.preset);
                        },
                      },
                      {
                        title: "Remove",
                        compact: true,
                        onClick: () =>
                          !!profile &&
                          removePreset(
                            { userId: profile._id, name: preset.name },
                            {
                              onSuccess: () =>
                                toast.success({
                                  description:
                                    "Preset was successfully removed",
                                }),
                            }
                          ),
                        color: ButtonColor.RED,
                      },
                    ]}
                  />
                ))
              ) : (
                <p style={{ textAlign: "center" }}>List is empty</p>
              )}
            </div>
          ) : (
            <Loader type="propogate" />
          )}
        </>
      )}
    </div>
  );
};
