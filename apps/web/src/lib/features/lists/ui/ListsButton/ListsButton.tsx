"use client";

import { CSSProperties, FC, useCallback, useRef, useState } from "react";
import { IGameResponse } from "@mooncellar/schemas";
import { useMyListGameCountsQuery } from "@/src/lib/entities/list/api/list.queries";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { GameControlButton } from "@/src/lib/shared/ui/GameControls/GameControlButton";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SvgListBullet } from "@/src/lib/shared/ui/svg";
import { ListsModal, ListsPopover } from "../ListsPopover";

const ICON_STYLE: CSSProperties = { color: "inherit" };

export const ListsButton: FC<{ game: IGameResponse }> = ({ game }) => {
  const profile = useAuthStore((s) => s.profile);
  const isMobile = useStatesStore((s) => s.isMobile);
  const userId = profile?._id;
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { data: counts } = useMyListGameCountsQuery(userId);

  const count = counts?.[game._id] ?? 0;
  const close = useCallback(() => setIsOpen(false), []);

  const handleClick = () => {
    if (!userId) return;

    if (isMobile) {
      modal.open(<ListsModal game={game} userId={userId} />, {
        id: "game-lists",
      });
      return;
    }

    setIsOpen((current) => !current);
  };

  const tooltip = !userId
    ? "You must be logged in to use lists"
    : isOpen
      ? undefined
      : count
        ? `In ${count} ${commonUtils.addLastS("list", count)}`
        : "Add to list";

  return (
    <>
      <GameControlButton
        ref={anchorRef}
        icon={<SvgListBullet size="16" style={ICON_STYLE} />}
        label={
          count
            ? `In ${count} ${commonUtils.addLastS("list", count)}`
            : "Add to list"
        }
        tooltip={tooltip}
        tone="list"
        isActive={count > 0}
        badge={count || undefined}
        isExpanded={isOpen}
        isDisabled={!userId}
        onClick={handleClick}
      />
      {isOpen && !!userId && (
        <ListsPopover
          game={game}
          userId={userId}
          anchorRef={anchorRef}
          onClose={close}
        />
      )}
    </>
  );
};
