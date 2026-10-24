import { FC, useEffect } from "react";
import { Box } from "@/src/lib/shared/ui/Box";
import { CommentThread } from "@/src/lib/features/comments/ui/CommentThread";

interface IArticleCommentsProps {
  articleId: string;
  className?: string;
}

export const ARTICLE_COMMENTS_ID = "comments";

const HEAD_STYLE = { paddingInline: "var(--article-box-padding)" };
const CONTENT_STYLE = { padding: "var(--article-box-padding)" };

export const ArticleComments: FC<IArticleCommentsProps> = ({
  articleId,
  className,
}) => {
  useEffect(() => {
    const scrollFromHash = () => {
      if (window.location.hash !== `#${ARTICLE_COMMENTS_ID}`) return;

      requestAnimationFrame(() =>
        document
          .getElementById(ARTICLE_COMMENTS_ID)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    };

    scrollFromHash();
    window.addEventListener("hashchange", scrollFromHash);

    return () => window.removeEventListener("hashchange", scrollFromHash);
  }, []);

  return (
    <Box
      id={ARTICLE_COMMENTS_ID}
      title="Comments"
      isTitleStart
      className={className}
      headStyle={HEAD_STYLE}
      contentStyle={CONTENT_STYLE}
    >
      <CommentThread
        target={{ type: "article", id: articleId }}
        placeholder="What do you think about this post?"
        emptyTitle="No comments yet. Start the conversation."
        isDeferred
      />
    </Box>
  );
};
