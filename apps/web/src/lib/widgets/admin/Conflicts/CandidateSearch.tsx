import { FC } from "react";
import { IConflictItem } from "@mooncellar/schemas";
import { SearchPicker } from "@/src/lib/shared/ui/SearchPicker";
import { useGameSearch } from "@/src/lib/entities/game/model";
import { useAddConflictCandidateMutation } from "@/src/lib/entities/conflict/api";
import styles from "./Conflicts.module.scss";

const GAME_LINK = /\/games\/([^/?#]+)/;

const toGameRef = (query: string) => {
  const value = query.trim();

  return value.match(GAME_LINK)?.[1] ?? (/^\S+$/.test(value) ? value : null);
};

interface ICandidateSearchProps {
  item: IConflictItem;
  onAdded: () => void;
}

export const CandidateSearch: FC<ICandidateSearchProps> = ({
  item,
  onAdded,
}) => {
  const { mutate: addCandidate, isPending } = useAddConflictCandidateMutation();
  const gameSearch = useGameSearch();
  const ref = toGameRef(gameSearch.search);
  const isCandidate = (id: string) =>
    item.candidates.some(({ gameId, slug }) => gameId === id || slug === id);
  const isFound = gameSearch.options.some(
    ({ id, slug }) => id === ref || slug === ref
  );

  return (
    <div className={styles.manualSearch}>
      <SearchPicker
        label="Not among them? Find the game in the catalogue"
        placeholder="Search by name, or paste an id, slug or game link"
        search={gameSearch.search}
        onSearch={gameSearch.setSearch}
        isLoading={gameSearch.isLoading}
        disabled={isPending}
        options={[
          ...gameSearch.options,
          ...(ref && !isFound
            ? [
                {
                  id: ref,
                  label: `Add by id or slug: ${ref}`,
                  meta: "For a game the search does not show yet",
                },
              ]
            : []),
        ].map((option) =>
          isCandidate(option.id)
            ? {
                ...option,
                meta: [option.meta, "already a candidate"]
                  .filter(Boolean)
                  .join(" · "),
              }
            : option
        )}
        onPick={({ id }) => {
          gameSearch.setSearch("");
          if (isCandidate(id)) return;
          addCandidate(
            { source: item.source, externalId: item.externalId, game: id },
            { onSuccess: onAdded }
          );
        }}
      />
    </div>
  );
};
