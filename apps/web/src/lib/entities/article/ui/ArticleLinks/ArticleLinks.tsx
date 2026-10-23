import { FC } from "react";
import Link from "next/link";
import { IArticleListItem } from "@mooncellar/schemas";
import {
  ARTICLE_TYPE_LABELS,
  formatArticleDate,
  getArticleHref,
} from "@/src/lib/entities/article/model";
import styles from "./ArticleLinks.module.scss";

interface IArticleLinksProps {
  articles: IArticleListItem[];
}

export const ArticleLinks: FC<IArticleLinksProps> = ({ articles }) => (
  <ul className={styles.links}>
    {articles.map((article) => (
      <li key={article._id}>
        <Link href={getArticleHref(article.slug)} className={styles.link}>
          <span className={styles.link__title}>{article.title}</span>
          <span className={styles.link__meta}>
            {formatArticleDate(article.publishedAt)} ·{" "}
            {article.game?.name ?? ARTICLE_TYPE_LABELS.news}
          </span>
        </Link>
      </li>
    ))}
  </ul>
);
