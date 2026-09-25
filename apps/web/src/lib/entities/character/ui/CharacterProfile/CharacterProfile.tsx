import { FC, ReactNode } from "react";
import {
  ICharacterResponse,
  ICharacterTrait,
  stripBbcode,
} from "@mooncellar/schemas";
import { CharacterPortrait } from "@/src/lib/entities/character/ui/CharacterPortrait";
import { Spoiler } from "@/src/lib/shared/ui/Spoiler";
import styles from "./CharacterProfile.module.scss";

interface IFact {
  label: string;
  value: string;
}

interface ICharacterProfileProps {
  character: ICharacterResponse;
  action?: ReactNode;
}

const toTraitFacts = (traits: ICharacterTrait[]): IFact[] =>
  [
    ...traits.reduce(
      (groups, { group, name }) =>
        groups.set(group, [...(groups.get(group) ?? []), name]),
      new Map<string, string[]>()
    ),
  ].map(([label, names]) => ({ label, value: names.join(", ") }));

const Facts: FC<{ facts: IFact[] }> = ({ facts }) => (
  <dl className={styles.profile__facts}>
    {facts.map((fact) => (
      <div key={fact.label} className={styles.profile__fact}>
        <dt>{fact.label}</dt>
        <dd>{fact.value}</dd>
      </div>
    ))}
  </dl>
);

export const CharacterProfile: FC<ICharacterProfileProps> = ({
  character,
  action,
}) => {
  const traits = character.traits ?? [];
  const facts = [
    { label: "Gender", value: character.gender },
    { label: "Species", value: character.species },
    { label: "From", value: character.countryName },
  ]
    .filter((fact): fact is IFact => !!fact.value)
    .concat(toTraitFacts(traits.filter(({ isSpoiler }) => !isSpoiler)));
  const spoilerFacts = [
    { label: "Also known as", value: character.spoilerAkas?.join(", ") },
  ]
    .filter((fact): fact is IFact => !!fact.value)
    .concat(toTraitFacts(traits.filter(({ isSpoiler }) => isSpoiler)));

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
      {!!facts.length && <Facts facts={facts} />}
      {!!spoilerFacts.length && (
        <Spoiler className={styles.profile__spoiler}>
          <Facts facts={spoilerFacts} />
        </Spoiler>
      )}
      <p className={styles.profile__description}>
        {description || "No description yet."}
      </p>
    </article>
  );
};
