import { FC } from "react";
import {
  useLikedListsQuery,
  useUserListsQuery,
} from "@/src/lib/entities/list/api";
import { openListModal } from "@/src/lib/features/lists/ui/ListModal";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { ListCard } from "@/src/lib/shared/ui/ListCard";
import { ListCardsGrid } from "@/src/lib/shared/ui/ListCardsGrid";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SvgPlus } from "@/src/lib/shared/ui/svg";
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

  const handleCreate = () => openListModal({ userName });

  return (
    <section className={styles.lists}>
      <div className={styles.lists__head}>
        <SectionTitle as="h2">
          {isLiked ? "Liked lists" : "Lists"}
          {!!lists.length && (
            <span className={styles.lists__count}>{lists.length}</span>
          )}
        </SectionTitle>
        {canCreate && !!lists.length && (
          <Button
            color={ButtonColor.ACCENT}
            className={styles.lists__create}
            onClick={handleCreate}
          >
            <SvgPlus size="16" style={{ color: "inherit" }} />
            New list
          </Button>
        )}
      </div>
      {isListsLoading ? (
        <Loader type="moon" />
      ) : !lists.length ? (
        <div className={styles.lists__empty}>
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
          />
          {canCreate && (
            <Button color={ButtonColor.ACCENT} onClick={handleCreate}>
              <SvgPlus size="16" style={{ color: "inherit" }} />
              Create a list
            </Button>
          )}
        </div>
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
