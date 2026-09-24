import { FC, ReactNode } from "react";
import { ICharacterResponse, stripBbcode } from "@mooncellar/schemas";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import styles from "./CharacterProfile.module.scss";

interface ICharacterProfileProps {
  character: ICharacterResponse;
  action?: ReactNode;
}

export const CharacterProfile: FC<ICharacterProfileProps> = ({
  character,
  action,
}) => {
  const facts = [
    { label: "Gender", value: character.gender },
    { label: "Species", value: character.species },
    { label: "From", value: character.countryName },
  ].filter((fact) => !!fact.value);

  const description = character.description
    ? stripBbcode(character.description)
    : "";

  return (
    <article className={styles.profile}>
      <CharacterPortrait
        character={character}
        sizes="200px"
        className={styles.profile__portrait}
        priority
      />
      <div className={styles.profile__head}>
        <h2 className={styles.profile__name}>{character.name}</h2>
        {!!character.akas?.length && (
          <p className={styles.profile__akas}>
            Also known as {character.akas.join(", ")}
          </p>
        )}
      </div>
      {action}
      {!!facts.length && (
        <dl className={styles.profile__facts}>
          {facts.map((fact) => (
            <div key={fact.label} className={styles.profile__fact}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className={styles.profile__description}>
        {description || "No description yet."}
      </p>
    </article>
  );
};
