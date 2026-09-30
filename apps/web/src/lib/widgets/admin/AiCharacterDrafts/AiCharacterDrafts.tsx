"use client";

import { FC } from "react";
import {
  CHARACTER_AI_DRAFT_MAX_COUNT,
  ISaveCharacterRequest,
} from "@mooncellar/schemas";
import {
  useCharacterAiDraftsQuery,
  useDeleteCharacterAiDraftMutation,
  useRetryCharacterAiDraftMutation,
  useStartCharacterAiDraftMutation,
} from "@/src/lib/entities/character/api";
import { AiDrafts } from "@/src/lib/widgets/admin/AiDrafts";

interface IAiCharacterDraftsProps {
  isReplacing: boolean;
  onApply: (draft: ISaveCharacterRequest) => void;
}

export const AiCharacterDrafts: FC<IAiCharacterDraftsProps> = ({
  isReplacing,
  onApply,
}) => {
  const { data: runs = [] } = useCharacterAiDraftsQuery();
  const { mutate: startDraft, isPending: isStarting } =
    useStartCharacterAiDraftMutation();
  const { mutate: deleteDraft, isPending: isDeleting } =
    useDeleteCharacterAiDraftMutation();
  const { mutate: retryDraft, isPending: isRetrying } =
    useRetryCharacterAiDraftMutation();

  return (
    <AiDrafts
      label="Fill with AI: character name and game, or a game to list its characters"
      maxCount={CHARACTER_AI_DRAFT_MAX_COUNT}
      countLabel={`Characters to find, up to ${CHARACTER_AI_DRAFT_MAX_COUNT}`}
      runs={runs}
      isStarting={isStarting}
      isRetrying={isRetrying}
      isDeleting={isDeleting}
      isReplacing={isReplacing}
      onStart={(query, count, onStarted) =>
        startDraft({ query, count }, { onSuccess: onStarted })
      }
      onRetry={retryDraft}
      onDelete={deleteDraft}
      onApply={onApply}
    />
  );
};
