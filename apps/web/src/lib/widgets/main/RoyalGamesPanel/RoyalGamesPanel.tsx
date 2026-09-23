"use client";

import { FC, useState } from "react";
import styles from "./RoyalGamesPanel.module.scss";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { GamesList } from "@/src/lib/widgets/game/GamesList";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { SavedList } from "@/src/lib/shared/ui/SavedList";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useRoyalGames } from "@/src/lib/entities/royal/model/useRoyalGames";
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
  const { royalGames, setRoyalGames, removeRoyalGame } = useRoyalGames();
  const { profile, isAuth } = useAuthStore();

  const [tabIndex, setTabIndex] = useState(0);

  const { data: royalGamesData, isLoading: isRoyalGamesLoading } =
    useGamesByIdsQuery(royalGames || []);
  const { data: savedPresets } = useUserPresetsQuery(profile?._id ?? "");
  const isRoyalGamesLoaderShown = useMinimumLoading(isRoyalGamesLoading);
  const isPresetsLoaderShown = useMinimumLoading(!savedPresets);
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
        (!!royalGames?.length && isRoyalGamesLoaderShown ? (
          <Loader type="propogate" />
        ) : (
          <GamesList
            games={royalGamesData || []}
            getGames={(games) => setRoyalGames(games.map((game) => game._id))}
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
          {!!savedPresets && !isPresetsLoaderShown ? (
            <div className={styles.royal__saved}>
              {!!savedPresets?.length ? (
                <SavedList
                  items={savedPresets.map((preset) => ({
                    name: preset.name,
                    onApply: () => setRoyalGames(preset.preset),
                    onRemove: () =>
                      !!profile &&
                      removePreset(
                        { userId: profile._id, name: preset.name },
                        {
                          onSuccess: () =>
                            toast.success({
                              description: "Preset was successfully removed",
                            }),
                        }
                      ),
                  }))}
                />
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
