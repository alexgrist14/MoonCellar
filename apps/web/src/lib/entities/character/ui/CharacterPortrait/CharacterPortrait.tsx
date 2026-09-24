import { FC } from "react";
import Image from "next/image";
import classNames from "classnames";
import { ICharacterResponse } from "@mooncellar/schemas";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import styles from "./CharacterPortrait.module.scss";

interface ICharacterPortraitProps {
  character: Pick<ICharacterResponse, "name" | "mugShot" | "isExplicitImage">;
  sizes: string;
  className?: string;
  priority?: boolean;
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

export const CharacterPortrait: FC<ICharacterPortraitProps> = ({
  character,
  sizes,
  className,
  priority,
}) => {
  const hideImage = useHideAdult() && !!character.isExplicitImage;

  return (
    <div className={classNames(styles.portrait, className)}>
      {character.mugShot && !hideImage ? (
        <Image
          src={character.mugShot}
          alt={character.name}
          fill
          sizes={sizes}
          priority={priority}
          className={styles.portrait__image}
        />
      ) : (
        <span className={styles.portrait__initials} aria-hidden="true">
          {getInitials(character.name)}
        </span>
      )}
    </div>
  );
};
