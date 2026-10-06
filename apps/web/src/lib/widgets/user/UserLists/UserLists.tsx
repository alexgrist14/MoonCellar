import { FC, useState } from "react";
import {
  useLikedListsQuery,
  useReorderListsMutation,
  useUserListsQuery,
} from "@/src/lib/entities/list/api";
import { openListModal } from "@/src/lib/features/lists/ui/ListModal";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { ListCard, ListMosaic } from "@/src/lib/shared/ui/ListCard";
import { ListCardsGrid } from "@/src/lib/shared/ui/ListCardsGrid";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SortableGrid } from "@/src/lib/shared/ui/SortableGrid";
import { SvgPlus } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./UserLists.module.scss";

interface IUserListsProps {
  userId: string;
  userName: string;
  isOwnProfile: boolean;
  kind?: "own" | "liked";
}

export const UserLists: FC<IUserListsProps> = ({
  userId,
  userName,
  isOwnProfile,
  kind = "own",
}) => {
  const isLiked = kind === "liked";
  const ownLists = useUserListsQuery(userId, undefined, !isLiked);
  const likedLists = useLikedListsQuery(isLiked ? userId : undefined);
  const { data: lists = [], isLoading } = isLiked ? likedLists : ownLists;
  const isListsLoading = useMinimumLoading(isLoading);
  const canCreate = isOwnProfile && !isLiked;

  const [draft, setDraft] = useState<typeof lists | null>(null);
  const { mutate: reorderLists, isPending: isReordering } =
    useReorderListsMutation();
  const canReorder = canCreate && lists.length > 1;

  const handleCreate = () => openListModal({ userName });

  const finishReordering = () => {
    if (!draft) return;

    if (draft.every((list, index) => list._id === lists[index]?._id)) {
      setDraft(null);
      return;
    }

    reorderLists(
      draft.map((list) => list._id),
      {
        onSuccess: () => {
          setDraft(null);
          toast.success({ description: "Order saved" });
        },
        onError: () => toast.error({ description: "Could not save the order" }),
      }
    );
  };

  return (
    <section className={styles.lists}>
      <SectionTitle
        as="h2"
        count={lists.length || undefined}
        action={
          draft ? (
            <div className={styles.lists__actions}>
              <Button
                color={ButtonColor.DEFAULT}
                disabled={isReordering}
                onClick={() => setDraft(null)}
              >
                Cancel
              </Button>
              <Button
                color={ButtonColor.ACCENT}
                disabled={isReordering}
                onClick={finishReordering}
              >
                Done
              </Button>
            </div>
          ) : (
            canCreate &&
            !!lists.length && (
              <div className={styles.lists__actions}>
                {canReorder && (
                  <Button
                    color={ButtonColor.DEFAULT}
                    onClick={() => setDraft(lists)}
                  >
                    Reorder
                  </Button>
                )}
                <Button
                  color={ButtonColor.ACCENT}
                  onClick={handleCreate}
                >
                  <SvgPlus size="16" style={{ color: "inherit" }} />
                  New list
                </Button>
              </div>
            )
          )
        }
      >
        {isLiked ? "Liked lists" : "Lists"}
      </SectionTitle>
      {isListsLoading ? (
        <Loader type="moon" />
      ) : !lists.length ? (
        <EmptyState
          title={
            isLiked
              ? "No liked lists"
              : isOwnProfile
                ? "No lists yet"
                : "No public lists"
          }
          description={
            isLiked
              ? isOwnProfile
                ? "Press the heart on any list to keep it here."
                : `${userName} has not liked any lists yet.`
              : isOwnProfile
                ? "Collect games around any idea — a mood, a ranking, a plan for co-op nights."
                : `${userName} has not shared any lists yet.`
          }
          action={
            canCreate && (
              <Button
                color={ButtonColor.ACCENT}
                onClick={handleCreate}
              >
                <SvgPlus size="16" style={{ color: "inherit" }} />
                Create a list
              </Button>
            )
          }
        />
      ) : draft ? (
        <SortableGrid
          items={draft}
          getKey={(list) => list._id}
          getName={(list) => list.name}
          renderCover={(list) => (
            <ListMosaic covers={list.covers} sizes="160px" />
          )}
          onChange={setDraft}
          coverRatio="var(--cover-ratio)"
          isDisabled={isReordering}
          isRemovable={false}
          className={styles.lists__sortable}
        />
      ) : (
        <ListCardsGrid>
          {lists.map((list) => (
            <ListCard key={list._id} list={list} isWithAuthor={isLiked} />
          ))}
        </ListCardsGrid>
      )}
    </section>
  );
};
