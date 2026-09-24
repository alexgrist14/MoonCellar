"use client";

import { FC, useState } from "react";
import classNames from "classnames";
import styles from "./GameRelated.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { GamesCards } from "@/src/lib/widgets/game/GamesCards";
import {
  IGameResponse,
  IRelatedGameKey,
  IRelatedGamesResponse,
} from "@mooncellar/schemas";

const RELATION_LABELS: Record<IRelatedGameKey, string> = {
  parent_game: "Main game",
  prequels: "Prequel",
  sequels: "Sequel",
  side_stories: "Side story",
  parent_stories: "Parent story",
  dlcs: "DLC",
  expansions: "Expansion",
  standalone_expansions: "Standalone expansion",
  remakes: "Remake",
  remasters: "Remaster",
  ports: "Port",
  forks: "Fork",
  alternative_versions: "Alternative version",
  expanded_games: "Expanded game",
  bundles: "Bundle",
  same_series: "Same series",
  same_setting: "Same setting",
  shared_characters: "Shared characters",
  similar_games: "Similar",
};

const RELATED_GROUPS: {
  key: string;
  label: string;
  relations: IRelatedGameKey[];
}[] = [
  {
    key: "story",
    label: "Story",
    relations: [
      "parent_game",
      "prequels",
      "sequels",
      "side_stories",
      "parent_stories",
    ],
  },
  {
    key: "addons",
    label: "Add-ons",
    relations: ["dlcs", "expansions", "standalone_expansions"],
  },
  {
    key: "versions",
    label: "Versions",
    relations: [
      "remakes",
      "remasters",
      "ports",
      "forks",
      "alternative_versions",
      "expanded_games",
      "bundles",
    ],
  },
  {
    key: "universe",
    label: "Universe",
    relations: ["same_series", "same_setting", "shared_characters"],
  },
  { key: "similar", label: "Similar", relations: ["similar_games"] },
];

interface IGameRelatedProps {
  related?: IRelatedGamesResponse;
}

export const GameRelated: FC<IGameRelatedProps> = ({ related }) => {
  const panels = RELATED_GROUPS.map((group) => {
    const relationById = new Map<string, IRelatedGameKey>();
    const games: IGameResponse[] = [];

    group.relations.forEach((relation) =>
      related?.[relation]?.forEach((game) => {
        if (relationById.has(game._id)) return;
        relationById.set(game._id, relation);
        games.push(game);
      })
    );

    return {
      ...group,
      games,
      relationById,
      isMixed: new Set(relationById.values()).size > 1,
    };
  }).filter((panel) => !!panel.games.length);

  const [activeKey, setActiveKey] = useState(panels[0]?.key);

  if (!panels.length) return null;

  const currentKey = panels.some((panel) => panel.key === activeKey)
    ? activeKey
    : panels[0].key;

  const tabs =
    panels.length > 1 ? (
      <Tabs
        theme="segmented"
        ariaLabel="Related games groups"
        contents={panels.map((panel) => ({
          tabName: `${panel.label} ${panel.games.length}`,
          onTabClick: () => setActiveKey(panel.key),
        }))}
      />
    ) : undefined;

  return (
    <Box
      title={panels.length > 1 ? "Related games" : panels[0].label}
      isTitleStart
      titleAction={tabs}
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      {panels.map((panel) => (
        <div
          key={panel.key}
          className={classNames(styles.related__panel, {
            [styles.related__panel_hidden]: panel.key !== currentKey,
          })}
        >
          <GamesCards
            games={panel.games}
            isWithoutScroll
            columns={6}
            additionalGameNode={
              panel.isMixed
                ? (game) => (
                    <span className={styles.related__relation}>
                      {RELATION_LABELS[panel.relationById.get(game._id)!]}
                    </span>
                  )
                : undefined
            }
          />
        </div>
      ))}
    </Box>
  );
};
