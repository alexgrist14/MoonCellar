"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameAdminControls.module.scss";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import { gamesApi, hltbApi, igdbApi, vndbApi } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { IGameResponse } from "@mooncellar/schemas";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { revalidateGamePage } from "@/src/lib/entities/game/api/game.actions";
import {
  GAME_IMAGES_MODAL_ID,
  GameImagesModal,
} from "@/src/lib/features/game/ui/GameImagesModal";

interface IGameAdminControlsProps {
  game: IGameResponse;
}

export const GameAdminControls: FC<IGameAdminControlsProps> = ({ game }) => {
  const router = useRouter();
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const [isParsing, setIsParsing] = useState(false);
  const [isParsingHltb, setIsParsingHltb] = useState(false);
  const [isParsingVndb, setIsParsingVndb] = useState(false);
  const [hltbId, setHltbId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isAdmin) return null;

  const igdbId = game.vndb ? undefined : game.igdb?.gameId;
  const vnId = game.vndb?.vnId;

  const handleParse = async () => {
    if (!igdbId) return;

    setIsParsing(true);

    try {
      const { data } = await igdbApi.parseGame(igdbId);

      toast.success({ title: "Parsed from IGDB", description: game.name });

      await revalidateGamePage(game.slug, data?.slug);
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

  const handleParseVndb = async () => {
    setIsParsingVndb(true);

    try {
      const { data } = await vndbApi.parseGame(game._id);

      if (data.status === "failed") {
        toast.error({ title: "VNDB parse failed", description: data.message });
        return;
      }

      toast.success({ title: "Parsed from VNDB", description: data.message });

      await revalidateGamePage(game.slug, data.slug);
      router.refresh();
    } catch {
      toast.error({
        title: "Failed to parse from VNDB",
        description: game.name,
      });
    } finally {
      setIsParsingVndb(false);
    }
  };

  const handleParseHltb = async () => {
    setIsParsingHltb(true);

    try {
      const { data } = await hltbApi.parseGame({
        gameId: game._id,
        hltbId: hltbId.trim() || undefined,
      });

      if (data.status === "not_found") {
        toast.error({ title: "No HLTB match", description: data.message });
        return;
      }

      toast.success({ title: "Parsed from HLTB", description: data.message });

      await revalidateGamePage(game.slug, data.slug);
      router.refresh();
    } catch {
      toast.error({
        title: "Failed to parse from HLTB",
        description: game.name,
      });
    } finally {
      setIsParsingHltb(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(game._id);
      toast.success({ title: "Game id copied", description: game._id });
    } catch {
      toast.error({ title: "Failed to copy the game id" });
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
    <ExpandMenu position="bottom-right" titleOpen="Admin">
      <div className={styles.controls}>
        <div className={styles.id}>
          <span className={styles.id__value}>{game._id}</span>
          <Button color={ButtonColor.DEFAULT} compact onClick={handleCopyId}>
            Copy
          </Button>
        </div>
        <Button
          color={ButtonColor.DEFAULT}
          onClick={() => router.push(`/admin/games/${game._id}`)}
        >
          Edit game
        </Button>
        {!!(game.artworks?.length || game.screenshots?.length) && (
          <Button
            color={ButtonColor.DEFAULT}
            onClick={() =>
              modal.open(<GameImagesModal game={game} />, {
                id: GAME_IMAGES_MODAL_ID,
              })
            }
          >
            Background and banner
          </Button>
        )}
        {!!igdbId && (
          <Button
            color={ButtonColor.DEFAULT}
            disabled={isParsing}
            onClick={handleParse}
          >
            {isParsing ? "Parsing…" : "Parse from IGDB"}
          </Button>
        )}
        {!!vnId && (
          <Button
            color={ButtonColor.DEFAULT}
            disabled={isParsingVndb}
            onClick={handleParseVndb}
          >
            {isParsingVndb ? "Parsing…" : "Parse from VNDB"}
          </Button>
        )}
        <Input
          containerClassname={styles.input}
          value={hltbId}
          placeholder={
            game.hltb?.hltbId
              ? `HLTB id (current: ${game.hltb.hltbId})`
              : "HLTB id (optional)"
          }
          disabled={isParsingHltb}
          onChange={(event) => setHltbId(event.target.value)}
        />
        <Button
          color={ButtonColor.DEFAULT}
          disabled={isParsingHltb}
          onClick={handleParseHltb}
        >
          {isParsingHltb
            ? "Parsing…"
            : hltbId.trim()
              ? "Parse HLTB by id"
              : "Parse from HLTB"}
        </Button>
        <Button
          color={ButtonColor.RED}
          disabled={isDeleting}
          onClick={handleDelete}
        >
          Delete game
        </Button>
      </div>
    </ExpandMenu>
  );
};
