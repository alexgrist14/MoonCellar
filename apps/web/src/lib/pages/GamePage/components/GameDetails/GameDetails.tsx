import { FC, ReactNode, useMemo } from "react";
import Link from "next/link";
import styles from "./GameDetails.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { IGameResponse } from "@mooncellar/schemas";

interface IGameDetailsProps {
  game: IGameResponse;
}

interface IDetailsValue {
  key: string;
  label: string;
  href?: string;
  title?: string;
}

interface IDetailsRow {
  label: string;
  values: IDetailsValue[];
}

const toValues = (
  items: string[] | undefined,
  buildHref: (item: string) => string
): IDetailsValue[] =>
  (items || []).map((item) => ({
    key: item,
    label: item,
    href: buildHref(item),
  }));

export const GameDetails: FC<IGameDetailsProps> = ({ game }) => {
  const rows = useMemo(() => {
    const items: IDetailsRow[] = [
      {
        label: "Companies",
        values: (game.companies || []).map((company) => ({
          key: company.name,
          label: company.name,
          href: `/games?selectedCompanies[]=${company.name}`,
        })),
      },
      {
        label: "Franchises",
        values: toValues(
          game.franchises,
          (item) => `/games?selectedFranchises[]=${item}`
        ),
      },
      {
        label: "Game modes",
        values: toValues(
          game.modes,
          (item) => `/games?selectedModes[]=${item}`
        ),
      },
      {
        label: "Themes",
        values: toValues(
          game.themes,
          (item) => `/games?selectedThemes[]=${item}`
        ),
      },
      {
        label: "Game engines",
        values: toValues(
          game.game_engines,
          (item) => `/games?selectedGameEngines[]=${item}`
        ),
      },
      {
        label: "Languages",
        values: toValues(
          game.languages,
          (item) => `/games?selectedLanguages[]=${item}`
        ),
      },
      {
        label: "Age ratings",
        values: (game.ageRatings || []).map((rating) => ({
          key: rating.organization + rating.rating,
          label: `${rating.organization}: ${rating.rating}`,
          href: `/games?selectedAgeRatings[]=${rating.organization}|${rating.rating}`,
          title: rating.synopsis,
        })),
      },
      {
        label: "Version",
        values: !game.versionTitle
          ? []
          : [{ key: game.versionTitle, label: game.versionTitle }],
      },
    ];

    return items.filter((row) => !!row.values.length);
  }, [game]);

  if (!rows.length) return null;

  return (
    <Box title="Details" isTitleStart classNameContent={styles.details}>
      {rows.map((row) => (
        <div key={row.label} className={styles.details__row}>
          <p className={styles.details__label}>{row.label}:</p>
          <p className={styles.details__value}>
            {row.values.map<ReactNode>((value, i) => (
              <span key={value.key + i} title={value.title}>
                {!value.href ? (
                  value.label
                ) : (
                  <Link href={value.href}>{value.label}</Link>
                )}
                {i !== row.values.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </div>
      ))}
    </Box>
  );
};
