"use client";

import { FC } from "react";
import { IAddGameRequest } from "@mooncellar/schemas";
import { useGameAiDraftsQuery } from "@/src/lib/entities/game/api/game.queries";
import {
  useDeleteGameAiDraftMutation,
  useRetryGameAiDraftMutation,
  useStartGameAiDraftMutation,
} from "@/src/lib/entities/game/api/game.mutations";
import { AiDrafts } from "@/src/lib/widgets/admin/AiDrafts";

interface IAiGameDraftsProps {
  isReplacing: boolean;
  onApply: (draft: Partial<IAddGameRequest>) => void;
}

export const AiGameDrafts: FC<IAiGameDraftsProps> = ({
  isReplacing,
  onApply,
}) => {
  const { data: runs = [] } = useGameAiDraftsQuery();
  const { mutate: startDraft, isPending: isStarting } =
    useStartGameAiDraftMutation();
  const { mutate: deleteDraft, isPending: isDeleting } =
    useDeleteGameAiDraftMutation();
  const { mutate: retryDraft, isPending: isRetrying } =
    useRetryGameAiDraftMutation();

  return (
    <AiDrafts
      label="Fill with AI: game name or link"
      runs={runs}
      isStarting={isStarting}
      isRetrying={isRetrying}
      isDeleting={isDeleting}
      isReplacing={isReplacing}
      onStart={(query, _count, onStarted) =>
        startDraft(query, { onSuccess: onStarted })
      }
      onRetry={retryDraft}
      onDelete={deleteDraft}
      onApply={onApply}
    />
  );
};
