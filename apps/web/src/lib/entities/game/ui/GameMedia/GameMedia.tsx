"use client";

import { FC, useState } from "react";
import classNames from "classnames";
import styles from "./GameMedia.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { Slideshow } from "@/src/lib/shared/ui/Slideshow";
import { VideosRow } from "@/src/lib/shared/ui/VideosRow";
import { IGameResponse } from "@mooncellar/schemas";

interface IGameMediaProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameMedia: FC<IGameMediaProps> = ({ game, isBoxed = true }) => {
  const panels = [
    { key: "screenshots", label: "Screenshots", items: game.screenshots || [] },
    { key: "artworks", label: "Artworks", items: game.artworks || [] },
    { key: "videos", label: "Videos", items: game.videos || [] },
  ].filter((panel) => !!panel.items.length);

  const [activeKey, setActiveKey] = useState(panels[0]?.key);

  if (!panels.length) return null;

  const currentKey = panels.some((panel) => panel.key === activeKey)
    ? activeKey
    : panels[0].key;

  const tabs =
    panels.length > 1 ? (
      <Tabs
        buttonColor="transparent"
        buttonsClassName={styles.mediaTabs}
        contents={panels.map((panel) => ({
          tabName: `${panel.label} ${panel.items.length}`,
          className: classNames(styles.mediaTab, {
            [styles.mediaTabActive]: panel.key === currentKey,
          }),
          onTabClick: () => setActiveKey(panel.key),
        }))}
      />
    ) : undefined;

  const panelsContent = panels.map((panel) => (
    <div
      key={panel.key}
      className={classNames(styles.media__panel, {
        [styles.media__panel_hidden]: panel.key !== currentKey,
      })}
    >
      {panel.key === "videos" ? (
        <VideosRow videos={panel.items} />
      ) : (
        <Slideshow pictures={panel.items} />
      )}
    </div>
  ));

  if (!isBoxed) {
    return (
      <div className={styles.media}>
        <div className={styles.media__head}>
          <h4>{panels.length > 1 ? "Media:" : `${panels[0].label}:`}</h4>
          {tabs}
        </div>
        {panelsContent}
      </div>
    );
  }

  return (
    <Box
      title="Media"
      isTitleStart
      titleAction={tabs}
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      {panelsContent}
    </Box>
  );
};
