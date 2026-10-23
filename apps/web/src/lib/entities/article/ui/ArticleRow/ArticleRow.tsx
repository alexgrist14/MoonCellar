import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { IArticleListItem } from "@mooncellar/schemas";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import {
  ARTICLE_TYPE_LABELS,
  formatArticleDate,
  getArticleHref,
  getArticleImage,
  isArticleMediaHidden,
} from "@/src/lib/entities/article/model";
import styles from "./ArticleRow.module.scss";

interface IArticleRowProps {
  article: IArticleListItem;
  isPriority?: boolean;
}

export const ArticleRow: FC<IArticleRowProps> = ({ article, isPriority }) => {
  const isAdultHidden = useHideAdult();
  const image = getArticleImage(article, isAdultHidden);
  const isMediaHidden = isArticleMediaHidden(article, isAdultHidden);

  return (
    <Link href={getArticleHref(article.slug)} className={styles.row}>
      <div className={styles.row__thumb}>
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 500px) 96px, 176px"
            priority={isPriority}
            className={styles.row__image}
          />
        ) : (
          <Cover isWithoutText className={styles.row__placeholder} />
        )}
      </div>
      <div className={styles.row__body}>
        {article.game ? (
          <span className={styles.row__game}>
            <span className={styles.row__gameCover}>
              {!!article.game.cover && !isMediaHidden && (
                <Image src={article.game.cover} alt="" fill sizes="14px" />
              )}
            </span>
            {article.game.name}
          </span>
        ) : (
          <Badge tone="muted">{ARTICLE_TYPE_LABELS.news}</Badge>
        )}
        <h2 className={styles.row__title}>{article.title}</h2>
        <p className={styles.row__summary}>{article.summary}</p>
        <p className={styles.row__meta}>
          {[
            formatArticleDate(article.publishedAt),
            `${article.readingMinutes} min read`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  );
};

export const ArticleRowSkeleton: FC = () => (
  <div className={styles.row}>
    <Skeleton aspectRatio="16 / 9" radius="var(--radius-x3)" />
    <div className={styles.row__body}>
      <Skeleton shape="text" width="30%" />
      <Skeleton shape="text" width="90%" />
      <Skeleton shape="text" count={2} />
    </div>
  </div>
);
