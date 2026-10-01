import { FC, useEffect, useState } from "react";
import classNames from "classnames";
import { ICustomList } from "@mooncellar/schemas";
import { useSetListLikeMutation } from "@/src/lib/entities/list/api/list.mutations";
import { ReactionButton } from "@/src/lib/shared/ui/ReactionButton";
import { SvgHeart, SvgHeartFilled } from "@/src/lib/shared/ui/svg";
import styles from "./ListLikeButton.module.scss";

interface IListLikeButtonProps {
  list: ICustomList;
  viewerId?: string;
  className?: string;
}

export const ListLikeButton: FC<IListLikeButtonProps> = ({
  list,
  viewerId,
  className,
}) => {
  const [state, setState] = useState({
    isLiked: !!list.isLiked,
    likesCount: list.likesCount,
  });
  const { mutate: setLike, isPending } = useSetListLikeMutation();

  useEffect(() => {
    setState({ isLiked: !!list.isLiked, likesCount: list.likesCount });
  }, [list.isLiked, list.likesCount]);

  const isOwner = !!viewerId && viewerId === list.userId;
  const tooltip = !viewerId
    ? "You must be logged in to like lists"
    : isOwner
      ? "You can't like your own list"
      : state.isLiked
        ? "Unlike"
        : "Like";

  const handleClick = () => {
    const previous = state;
    const isLiked = !state.isLiked;

    setState({
      isLiked,
      likesCount: Math.max(state.likesCount + (isLiked ? 1 : -1), 0),
    });
    setLike(
      { id: list._id, isLiked },
      {
        onSuccess: (result) => setState(result),
        onError: () => setState(previous),
      }
    );
  };

  return (
    <ReactionButton
      variant="boxed"
      className={classNames(styles.like, className)}
      icon={<SvgHeart size="16" />}
      activeIcon={<SvgHeartFilled size="16" />}
      count={state.likesCount}
      isActive={state.isLiked}
      isReadOnly={!viewerId || isOwner}
      isDisabled={isPending}
      tooltip={tooltip}
      ariaLabel={`${tooltip} · ${state.likesCount}`}
      onClick={handleClick}
    />
  );
};
