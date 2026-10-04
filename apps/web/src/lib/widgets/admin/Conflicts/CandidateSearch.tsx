import { FC } from "react";
import { IConflictItem } from "@mooncellar/schemas";
import { SearchPicker } from "@/src/lib/shared/ui/SearchPicker";
import { useGameSearch } from "@/src/lib/entities/game/model";
import { useAddConflictCandidateMutation } from "@/src/lib/entities/conflict/api";
import styles from "./Conflicts.module.scss";

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
  const isCandidate = (id: string) =>
    item.candidates.some(({ gameId }) => gameId === id);

  return (
    <div className={styles.manualSearch}>
      <SearchPicker
        label="Not among them? Find the game in the catalogue"
        placeholder="Search a game by name"
        search={gameSearch.search}
        onSearch={gameSearch.setSearch}
        isLoading={gameSearch.isLoading}
        disabled={isPending}
        options={gameSearch.options.map((option) =>
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
            { source: item.source, externalId: item.externalId, gameId: id },
            { onSuccess: onAdded }
          );
        }}
      />
    </div>
  );
};
