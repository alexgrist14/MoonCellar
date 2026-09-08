import { FC } from "react";
import styles from "./GameOverview.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { ExpandableBlock } from "@/src/lib/shared/ui/ExpandableBlock";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";

interface IGameOverviewProps {
  game: IGameResponse;
  className?: string;
}

export const GameOverview: FC<IGameOverviewProps> = ({ game, className }) => {
  if (!game.summary && !game.storyline && !game.keywords?.length) return null;

  return (
    <Box
      className={className}
      wrapperStyle={{ height: "auto" }}
      templateStyle={{ height: "100%" }}
      classNameContent={styles.overview}
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      {!!game.summary && (
        <div className={styles.overview__text}>
          <h4>Summary:</h4>
          <ExpandableBlock modalTitle="Summary">
            <p>{game.summary}</p>
          </ExpandableBlock>
        </div>
      )}
      {!!game.storyline && (
        <div className={styles.overview__text}>
          <h4>Storyline:</h4>
          <ExpandableBlock modalTitle="Storyline">
            <p>{game.storyline}</p>
          </ExpandableBlock>
        </div>
      )}
      {!!game.keywords?.length && (
        <div className={styles.overview__keywords}>
          <h4>Keywords:</h4>
          <ExpandableBlock
            modalTitle="Keywords"
            clampHeight="var(--game-keywords-collapsed-height)"
            classNameContent={styles.overview__chips}
          >
            {game.keywords.map((keyword) => (
              <Chip
                key={keyword}
                href={`/games?selectedKeywords[]=${keyword}`}
                variant="outlined"
              >
                {keyword}
              </Chip>
            ))}
          </ExpandableBlock>
        </div>
      )}
    </Box>
  );
};
