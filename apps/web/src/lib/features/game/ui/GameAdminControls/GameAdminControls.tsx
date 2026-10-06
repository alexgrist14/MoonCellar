"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./GameAdminControls.module.scss";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { TextField } from "@/src/lib/shared/ui/Fields";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import {
  gamesApi,
  hltbApi,
  igdbApi,
  raApi,
  steamAPI,
  vndbApi,
} from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { IGameResponse } from "@mooncellar/schemas";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { useGameConflictsQuery } from "@/src/lib/entities/conflict/api";
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
  const [isFullParsing, setIsFullParsing] = useState(false);
  const [isParsingHltb, setIsParsingHltb] = useState(false);
  const [isParsingSteam, setIsParsingSteam] = useState(false);
  const [isParsingVndb, setIsParsingVndb] = useState(false);
  const [isParsingRa, setIsParsingRa] = useState(false);
  const [hltbId, setHltbId] = useState(game.hltb?.hltbId ?? "");
  const [vndbId, setVndbId] = useState(game.vndb?.vnId ?? "");
  const [raId, setRaId] = useState(
    game.retroachievements?.length === 1
      ? String(game.retroachievements[0].gameId)
      : ""
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);

  const { data: conflicts = [], refetch: refetchConflicts } =
    useGameConflictsQuery(game._id, !!isAdmin);

  if (!isAdmin) return null;

  const vnId = game.vndb?.vnId;
  const igdbId = vnId ? undefined : game.igdb?.gameId;

  const handleParse = async (forceParse = false) => {
    if (!igdbId) return;

    const setLoading = forceParse ? setIsFullParsing : setIsParsing;

    setLoading(true);

    try {
      const { data } = await igdbApi.parseGame(igdbId, true, forceParse);

      toast.success({
        title: forceParse ? "Fully reparsed from IGDB" : "Parsed from IGDB",
        description: game.name,
      });

      await revalidateGamePage(game.slug, data?.slug);
      router.refresh();
    } catch {
      toast.error({
        title: "Failed to parse from IGDB",
        description: game.name,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleParseVndb = async () => {
    setIsParsingVndb(true);

    try {
      const { data } = await vndbApi.parseGame(
        game._id,
        vndbId.trim() || undefined
      );

      if (data.status === "failed") {
        toast.error({ title: "VNDB parse failed", description: data.message });
        return;
      }

      toast.success({ title: "Parsed from VNDB", description: data.message });

      await revalidateGamePage(game.slug, data.slug);
      router.refresh();
      refetchConflicts();
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
      refetchConflicts();
    } catch {
      toast.error({
        title: "Failed to parse from HLTB",
        description: game.name,
      });
    } finally {
      setIsParsingHltb(false);
    }
  };

  const handleParseRa = async () => {
    setIsParsingRa(true);

    try {
      const { data } = await raApi.parseGame({
        gameId: game._id,
        raId: raId.trim() || undefined,
      });

      toast.success({
        title: "Parsed from RetroAchievements",
        description: data.message,
      });

      await revalidateGamePage(game.slug, data.slug);
      router.refresh();
      refetchConflicts();
    } catch {
      return;
    } finally {
      setIsParsingRa(false);
    }
  };

  const handleRevalidate = async () => {
    setIsRevalidating(true);

    try {
      await revalidateGamePage(game.slug);
      toast.success({ title: "Page cache cleared", description: game.name });
      router.refresh();
    } catch {
      toast.error({
        title: "Failed to clear the page cache",
        description: game.name,
      });
    } finally {
      setIsRevalidating(false);
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

  const steamAppId = game.externalPages?.find(
    (page) => page.name === "Steam" && /^\d+$/.test(page.uid ?? "")
  )?.uid;

  const handleParseSteamAchievements = async () => {
    setIsParsingSteam(true);

    try {
      const { data } = await steamAPI.parseAchievements(game._id);

      toast.success({
        title: "Parsed Steam achievements",
        description: data.total
          ? `${data.total} achievements on Steam`
          : "The Steam app has no achievements",
      });

      await revalidateGamePage(game.slug);
      router.refresh();
    } catch {
      return;
    } finally {
      setIsParsingSteam(false);
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
    <ExpandMenu
      position="bottom-right"
      titleOpen={
        conflicts.length ? (
          <span className={styles.title}>
            Admin
            <Badge tone="attention">{conflicts.length}</Badge>
          </span>
        ) : (
          "Admin"
        )
      }
    >
      <div className={styles.controls}>
        {!!conflicts.length && (
          <div className={styles.conflicts}>
            <p className={styles.conflicts__title}>Conflicts</p>
            {conflicts.map(({ source, externalId, externalName }) => (
              <Button
                key={`${source}-${externalId}`}
                color={ButtonColor.DEFAULT}
                href={`/admin/conflicts?source=${source}&conflict=${encodeURIComponent(externalId)}`}
                target="_blank"
                rel="noreferrer"
              >
                {`${source.toUpperCase()} · ${externalName}`}
              </Button>
            ))}
          </div>
        )}
        <div className={styles.id}>
          <span className={styles.id__value}>{game._id}</span>
          <Button color={ButtonColor.DEFAULT} compact onClick={handleCopyId}>
            Copy
          </Button>
        </div>
        <Button color={ButtonColor.DEFAULT} href={`/admin/games/${game._id}`}>
          Edit game
        </Button>
        <Button
          color={ButtonColor.DEFAULT}
          disabled={isRevalidating}
          onClick={handleRevalidate}
        >
          {isRevalidating ? "Revalidating…" : "Revalidate page"}
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
            disabled={isParsing || isFullParsing}
            onClick={() => handleParse()}
          >
            {isParsing ? "Parsing…" : "Parse from IGDB"}
          </Button>
        )}
        {!!igdbId && (
          <Button
            color={ButtonColor.DEFAULT}
            disabled={isParsing || isFullParsing}
            tooltip="Replaces every IGDB field and re-downloads all images"
            onClick={() => handleParse(true)}
          >
            {isFullParsing ? "Parsing…" : "Full reparse from IGDB"}
          </Button>
        )}
        <TextField
          label="VNDB id"
          value={vndbId}
          placeholder="v17"
          disabled={isParsingVndb}
          onChange={setVndbId}
          isFlush
          action={
            <Button
              color={ButtonColor.DEFAULT}
              disabled={isParsingVndb || (!vnId && !vndbId.trim())}
              onClick={handleParseVndb}
            >
              {isParsingVndb ? "Parsing…" : "Parse"}
            </Button>
          }
        />
        <TextField
          label={
            (game.retroachievements?.length ?? 0) > 1
              ? `RetroAchievements id (${game.retroachievements!.length} sets linked)`
              : "RetroAchievements id"
          }
          value={raId}
          placeholder="32909"
          disabled={isParsingRa}
          onChange={setRaId}
          isFlush
          action={
            <Button
              color={ButtonColor.DEFAULT}
              disabled={
                isParsingRa || (!game.retroachievements?.length && !raId.trim())
              }
              onClick={handleParseRa}
            >
              {isParsingRa ? "Parsing…" : "Parse"}
            </Button>
          }
        />
        <TextField
          label="HLTB id"
          value={hltbId}
          placeholder="9705"
          disabled={isParsingHltb}
          onChange={setHltbId}
          isFlush
          action={
            <Button
              color={ButtonColor.DEFAULT}
              disabled={isParsingHltb}
              onClick={handleParseHltb}
            >
              {isParsingHltb ? "Parsing…" : "Parse"}
            </Button>
          }
        />
        {!!steamAppId && (
          <Button
            color={ButtonColor.DEFAULT}
            disabled={isParsingSteam}
            tooltip={
              game.steamAchievements
                ? `Current: ${game.steamAchievements.total} on Steam app ${game.steamAchievements.appId}`
                : `Steam app ${steamAppId}, not read yet`
            }
            onClick={handleParseSteamAchievements}
          >
            {isParsingSteam ? "Parsing…" : "Parse Steam achievements"}
          </Button>
        )}
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
