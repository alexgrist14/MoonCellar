import { FC, useMemo } from "react";
import classNames from "classnames";
import styles from "./GameLinksBlock.module.scss";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { IGameResponse } from "@mooncellar/schemas";
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

  return (
    <InfoBlock title="Links:" isBoxed={isBoxed}>
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
    </InfoBlock>
  );
};
