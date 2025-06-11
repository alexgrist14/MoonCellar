import { FC, useEffect, useState } from "react";
import styles from "./ConsolesList.module.scss";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { GamesList } from "@/src/lib/shared/ui/GamesList";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { axiosUtils } from "@/src/lib/shared/utils/axios";
import { IUserPreset } from "@/src/lib/shared/types/user.type";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { toast } from "@/src/lib/shared/utils/toast";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SaveForm } from "@/src/lib/shared/ui/SaveForm";

export const ConsolesList: FC<{ initialTabIndex?: number }> = ({
  initialTabIndex,
}) => {
  const {
    games,
    royalGames,
    setRoyalGames,
    removeRoyalGame,
    historyGames,
    setHistoryGames,
    removeHistoryGame,
  } = useGamesStore();
  const { profile } = useAuthStore();

  const [tabIndex, setTabIndex] = useState(initialTabIndex || 0);
  const [royalTabIndex, setRoyalTabIndex] = useState(0);
  const [savedPresets, setSavedPresets] = useState<IUserPreset[]>();

  useEffect(() => {
    !!profile &&
      userAPI
        .getPresets(profile?._id)
        .then((res) => setSavedPresets(res.data.presets))
        .catch(axiosUtils.toastError);
  }, [profile]);

  return (
    <div className={styles.consoles__list}>
      <div className={styles.consoles__options}>
        <Tabs
          defaultTabIndex={tabIndex}
          contents={[
            {
              tabName: "Gauntlet",
              style: { flexBasis: "33%" },
              onTabClick: () => {
                setTabIndex(0);
              },
            },
            {
              tabName:
                "Royal" +
                (!!royalGames?.length ? ` (${royalGames.length})` : ""),
              style: { flexBasis: "33%" },
              onTabClick: () => {
                setTabIndex(1);
              },
            },
            {
              tabName: "History",
              style: { flexBasis: "33%" },
              onTabClick: () => {
                setTabIndex(2);
              },
            },
          ]}
        />
      </div>
      {tabIndex === 0 && <GamesList games={games || royalGames || []} />}
      {tabIndex === 1 && (
        <>
          <Tabs
            defaultTabIndex={royalTabIndex}
            contents={[
              {
                tabName: "List",
                onTabClick: () => {
                  setRoyalTabIndex(0);
                },
              },
              {
                tabName: "Saved",
                onTabClick: () => {
                  setRoyalTabIndex(1);
                },
              },
            ]}
          />
          {royalTabIndex === 0 && (
            <GamesList
              games={royalGames || []}
              getGames={(games) => setRoyalGames(games)}
              removeGame={(game) => removeRoyalGame(game)}
              saveCallback={() =>
                modal.open(
                  <SaveForm
                    saveCallback={(name) => {
                      !!profile &&
                        userAPI
                          .addPreset(profile._id, {
                            name,
                            preset: JSON.stringify(royalGames),
                          })
                          .then((res) => {
                            setSavedPresets(res.data.presets);
                            toast.success({
                              description: "Preset was successfully saved",
                            });
                            modal.close();
                          })
                          .catch(axiosUtils.toastError);
                    }}
                  />
                )
              }
            />
          )}
          {royalTabIndex === 1 && (
            <div>
              {!!savedPresets ? (
                <div className={styles.filters__saved}>
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
                            color: "fancy",
                            style: { textAlign: "start" },
                            compact: true,
                            onClick: () => {
                              setRoyalGames(JSON.parse(preset.preset));
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
                                    description:
                                      "Preset was successfully removed",
                                  });
                                  setSavedPresets(res.data.presets);
                                })
                                .catch(axiosUtils.toastError),
                            color: "red",
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
            </div>
          )}
        </>
      )}
      {tabIndex === 2 && (
        <GamesList
          games={historyGames || []}
          getGames={(games) => setHistoryGames(games)}
          removeGame={(game) => removeHistoryGame(game)}
        />
      )}
    </div>
  );
};
