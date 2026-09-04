"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameAdminControls.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import { gamesApi, igdbApi } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { toast } from "@/src/lib/shared/utils/toast.utils";

interface IGameAdminControlsProps {
  game: IGameResponse;
}

export const GameAdminControls: FC<IGameAdminControlsProps> = ({ game }) => {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const [isParsing, setIsParsing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isAdmin) return null;

  const igdbId = game.igdb?.gameId;

  const handleParse = async () => {
    if (!igdbId) return;

    setIsParsing(true);

    try {
      await igdbApi.parseGame(igdbId);
      toast.success({ title: "Parsed from IGDB", description: game.name });
      router.refresh();
    } catch {
      toast.error({
        title: "Failed to parse from IGDB",
        description: game.name,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDelete = () => {
    const modalId = `delete-game-${game._id}`;

    modal.open(
      <ConfirmModal
        title="Delete game"
        message={
          <p>
            Are you sure you want to delete <strong>{game.name}</strong>?
          </p>
        }
        warning="This permanently deletes the game from the catalogue."
        onConfirm={async () => {
          setIsDeleting(true);

          try {
            await gamesApi.remove(game._id);
            modal.close(modalId);
            toast.success({ title: "Game deleted", description: game.name });
            router.push("/games");
          } catch {
            toast.error({
              title: "Failed to delete game",
              description: game.name,
            });
          } finally {
            setIsDeleting(false);
          }
        }}
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

  return (
    <Box title="Admin" classNameContent={styles.controls}>
      <Button
        color={ButtonColor.DEFAULT}
        onClick={() => router.push(`/admin/games/${game._id}`)}
      >
        Edit game
      </Button>
      {!!igdbId && (
        <Button
          color={ButtonColor.DEFAULT}
          disabled={isParsing}
          onClick={handleParse}
        >
          {isParsing ? "Parsing…" : "Parse from IGDB"}
        </Button>
      )}
      <Button
        color={ButtonColor.RED}
        disabled={isDeleting}
        onClick={handleDelete}
      >
        Delete game
      </Button>
    </Box>
  );
};
