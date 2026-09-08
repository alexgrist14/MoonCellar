import { FC, useMemo } from "react";
import classNames from "classnames";
import styles from "./GameLinksBlock.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { getGameLinks } from "@/src/lib/shared/utils/links.utils";

interface IGameLinksBlockProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameLinksBlock: FC<IGameLinksBlockProps> = ({
  game,
  isBoxed = true,
}) => {
  const links = useMemo(() => getGameLinks(game), [game]);

  if (!links.length) return null;

  const content = (
    <div className={styles.links}>
      <h4>Links:</h4>
      <div className={styles.links__chips}>
        {links.map((link) => (
          <Chip
            key={link.host}
            href={link.url}
            title={link.url}
            variant="outlined"
            isExternal
          >
            <span
              className={classNames(
                styles.links__dot,
                !link.isOfficial && styles.links__dot_muted
              )}
            />
            {link.host}
          </Chip>
        ))}
      </div>
    </div>
  );

  if (!isBoxed) return content;

  return <Box contentStyle={{ padding: "var(--padding-x3)" }}>{content}</Box>;
};
