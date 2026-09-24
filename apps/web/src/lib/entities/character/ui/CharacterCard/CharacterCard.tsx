import { ButtonHTMLAttributes, FC } from "react";
import classNames from "classnames";
import { ICharacterResponse } from "@mooncellar/schemas";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import styles from "./CharacterCard.module.scss";

interface ICharacterCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  character: ICharacterResponse;
  rank?: number;
  priority?: boolean;
}

export const CharacterCard: FC<ICharacterCardProps> = ({
  character,
  rank,
  priority,
  className,
  ...buttonProps
}) => {
  const meta = [character.species, character.gender]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      className={classNames(styles.card, className)}
      {...buttonProps}
    >
      <span className={styles.card__cover}>
        <CharacterPortrait
          character={character}
          sizes="(max-width: 480px) 104px, 128px"
          priority={priority}
        />
        {rank !== undefined && <span className={styles.card__rank}>{rank}</span>}
      </span>
      <span className={styles.card__name}>{character.name}</span>
      {!!meta && <span className={styles.card__meta}>{meta}</span>}
    </button>
  );
};
