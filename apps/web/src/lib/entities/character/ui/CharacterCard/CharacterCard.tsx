import { ButtonHTMLAttributes, FC } from "react";
import classNames from "classnames";
import { ICharacterResponse } from "@mooncellar/schemas";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import styles from "./CharacterCard.module.scss";

interface ICharacterCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  character: ICharacterResponse;
  rank?: number;
  priority?: boolean;
  isSpoiler?: boolean;
}

export const CharacterCard: FC<ICharacterCardProps> = ({
  character,
  rank,
  priority,
  className,
  isSpoiler = false,
  ...buttonProps
}) => {
  const meta = [character.species, character.gender]
    .filter(Boolean)
    .join(" · ");

  console.log(isSpoiler);

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
        {rank !== undefined && (
          <span className={styles.card__rank}>{rank}</span>
        )}
      </span>
      <span className={styles.card__name}>
        {" "}
        {isSpoiler && <span className={styles.card__spoiler}>(S) </span>}
        {character.name}
      </span>
      {!!meta && <span className={styles.card__meta}>{meta}</span>}
    </button>
  );
};
