"use client";

import { FC, useEffect, useState } from "react";
import styles from "./RoyalGamesPanel.module.scss";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { GamesList } from "@/src/lib/shared/ui/GamesList";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { IUserPreset } from "@/src/lib/shared/types/user.type";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { ButtonColor } from "@/src/lib/shared/ui/Button";
import { gamesApi, userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SaveForm } from "@/src/lib/shared/ui/SaveForm";

export const RoyalGamesPanel: FC = () => {
  const { royalGames, setRoyalGames, removeRoyalGame } = useGamesStore();
  const { profile } = useAuthStore();

  const [tabIndex, setTabIndex] = useState(0);
  const [savedPresets, setSavedPresets] = useState<IUserPreset[]>();

  useEffect(() => {
    !!profile &&
      userAPI
        .getPresets(profile?._id)
        .then((res) => setSavedPresets(res.data.presets));
  }, [profile]);

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
          {
            tabName: "Saved",
            onTabClick: () => {
              setTabIndex(1);
            },
          },
        ]}
      />
      {tabIndex === 0 && (
        <GamesList
          games={royalGames || []}
          getGames={(games) => setRoyalGames(games)}
          removeGame={(game) => removeRoyalGame(game)}
          saveCallback={() =>
            modal.open(
              <SaveForm
                saveCallback={(name) => {
                  !!profile &&
                    !!royalGames?.length &&
                    userAPI
                      .addPreset(profile._id, {
                        name,
                        preset: royalGames.map((game) => game._id),
                      })
                      .then((res) => {
                        setSavedPresets(res.data.presets);
                        toast.success({
                          description: "Preset was successfully saved",
                        });
                        modal.close();
                      });
                }}
              />
            )
          }
        />
      )}
      {tabIndex === 1 && (
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
                          gamesApi
                            .getByIds({
                              _ids: preset.preset,
                            })
                            .then((res) => setRoyalGames(res.data));
                        },
                      },
                      {
                        title: "Remove",
                        compact: true,
                        onClick: () =>
                          !!profile &&
                          userAPI
                            .removePreset(profile._id, preset.name)
                            .then((res) => {
                              toast.success({
                                description: "Preset was successfully removed",
                              });
                              setSavedPresets(res.data.presets);
                            }),
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
