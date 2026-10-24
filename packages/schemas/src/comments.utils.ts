export const COMMENT_TARGET_TYPES = ["game", "article"] as const;

export type ICommentTargetType = (typeof COMMENT_TARGET_TYPES)[number];

export interface ICommentTarget {
  type: ICommentTargetType;
  id: string;
}

export interface ICommentTargetFields {
  gameId?: string | null;
  articleId?: string | null;
}

export const getCommentTargetKey = ({ type, id }: ICommentTarget) =>
  `${type}:${id}`;

export const getCommentTargetFields = ({ type, id }: ICommentTarget) =>
  type === "game" ? { gameId: id } : { articleId: id };

export const getCommentTarget = ({
  gameId,
  articleId,
}: ICommentTargetFields): ICommentTarget | null => {
  if (articleId) return { type: "article", id: articleId };
  if (gameId) return { type: "game", id: gameId };

  return null;
};

export const isCommentOfTarget = (
  fields: ICommentTargetFields,
  target: ICommentTarget
) => {
  const own = getCommentTarget(fields);

  return !!own && getCommentTargetKey(own) === getCommentTargetKey(target);
};
