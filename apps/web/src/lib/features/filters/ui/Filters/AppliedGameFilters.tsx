"use client";

import { FC, useMemo } from "react";
import { IGameFilters, IGetGamesRequest } from "@mooncellar/schemas";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import {
  parseQueryFilters,
  pushFiltersToQuery,
} from "@/src/lib/shared/utils/filters.utils";
import { AppliedFilters, IAppliedFilter } from "@/src/lib/shared/ui/AppliedFilters";

type TFilterGroup = "selected" | "excluded";
type TFilterCategory = keyof IGameFilters;

const CATEGORY_LABELS: Record<TFilterCategory, string> = {
  platforms: "Platform",
  genres: "Genre",
  themes: "Theme",
  keywords: "Keyword",
  modes: "Game mode",
  types: "Game type",
  franchises: "Franchise",
  companies: "Company",
  game_engines: "Engine",
  player_perspectives: "Perspective",
  languages: "Language",
  status: "Status",
  ageRatings: "Age rating",
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as TFilterCategory[];

const toArray = (value?: string[] | string | null) =>
  Array.isArray(value) ? value : value ? [value] : [];

export const AppliedGameFilters: FC<{ className?: string }> = ({
  className,
}) => {
  const { asPath } = useAdvancedRouter();
  const systems = useCommonStore((state) => state.systems);

  const filters = useMemo(() => parseQueryFilters(asPath), [asPath]);

  const applied = useMemo<IAppliedFilter[]>(() => {
    const result: IAppliedFilter[] = [];

    const push = (key: string, label: string, next: IGetGamesRequest) =>
      result.push({ key, label, onRemove: () => pushFiltersToQuery(next) });

    if (filters.search) {
      push("search", `Name: ${filters.search}`, {
        ...filters,
        search: undefined,
      });
    }

    for (const category of CATEGORIES) {
      for (const group of ["selected", "excluded"] as TFilterGroup[]) {
        const values = toArray(filters[group]?.[category]);

        for (const value of values) {
          const name =
            category === "platforms"
              ? (systems?.find((system) => system._id === value)?.name ?? value)
              : value;
          const prefix =
            group === "selected"
              ? CATEGORY_LABELS[category]
              : `Without ${CATEGORY_LABELS[category].toLowerCase()}`;

          const rest = values.filter((item) => item !== value);
          const other = toArray(
            filters[group === "selected" ? "excluded" : "selected"]?.[category]
          );

          push(`${group}:${category}:${value}`, `${prefix}: ${name}`, {
            ...filters,
            [group]: { ...filters[group], [category]: rest },
            mode:
              rest.length || other.length
                ? filters.mode
                : { ...filters.mode, [category]: undefined },
          });
        }
      }
    }

    const [from, to] = filters.years ?? [];

    if (from != null || to != null) {
      const label =
        from != null && to != null
          ? from === to
            ? `Year: ${from}`
            : `Years: ${from}–${to}`
          : from != null
            ? `Released from ${from}`
            : `Released until ${to}`;

      push("years", label, { ...filters, years: undefined });
    }

    if (filters.rating != null) {
      push("rating", `Rating from ${filters.rating}`, {
        ...filters,
        rating: undefined,
      });
    }

    if (filters.votes != null) {
      push("votes", `Votes from ${filters.votes}`, {
        ...filters,
        votes: undefined,
      });
    }

    if (filters.isOnlyWithAchievements) {
      push("achievements", "Only with achievements", {
        ...filters,
        isOnlyWithAchievements: undefined,
      });
    }

    return result;
  }, [filters, systems]);

  return (
    <AppliedFilters
      className={className}
      filters={applied}
      onClearAll={() =>
        pushFiltersToQuery({
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        })
      }
    />
  );
};
