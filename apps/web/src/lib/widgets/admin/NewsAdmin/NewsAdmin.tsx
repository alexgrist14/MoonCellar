"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { ARTICLES_TAKE_MAX } from "@mooncellar/schemas";
import { useAdminArticlesQuery } from "@/src/lib/entities/article/api";
import {
  ARTICLE_TYPE_LABELS,
  formatArticleDate,
  formatArticleViewCount,
} from "@/src/lib/entities/article/model";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { Table } from "@/src/lib/shared/ui/Table";
import { SvgPlus } from "@/src/lib/shared/ui/svg";
import { ITableHeaders, ITableRows } from "@/src/lib/shared/types/table.type";
import styles from "./NewsAdmin.module.scss";

interface INewsAdminRow {
  title: unknown;
  kind: unknown;
  game: unknown;
  status: unknown;
  views: unknown;
  published: unknown;
  updated: unknown;
}

const HEADERS: ITableHeaders<INewsAdminRow> = {
  title: { content: "Title" },
  kind: { content: "Kind" },
  game: { content: "Game" },
  status: { content: "Status" },
  views: { content: "Views" },
  published: { content: "Published" },
  updated: { content: "Updated" },
};

export const NewsAdmin: FC = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminArticlesQuery({
    page,
    take: ARTICLES_TAKE_MAX,
  });
  const articles = data?.results ?? [];

  const rows: ITableRows<INewsAdminRow> = articles.map((article) => ({
    title: { content: article.title },
    kind: { content: ARTICLE_TYPE_LABELS[article.type] },
    game: { content: article.game?.name ?? "—" },
    status: {
      content: (
        <Badge
          tone={article.status === "published" ? "positive" : "attention"}
          isWithDot
        >
          {article.status === "published" ? "Published" : "Draft"}
        </Badge>
      ),
    },
    views: {
      content: article.publishedAt
        ? formatArticleViewCount(article.views)
        : "—",
    },
    published: { content: formatArticleDate(article.publishedAt) || "—" },
    updated: { content: formatArticleDate(article.updatedAt) },
  }));

  return (
    <div className={styles.news}>
      <div className={styles.news__toolbar}>
        <Button href="/admin/news/new" color={ButtonColor.ACCENT}>
          <SvgPlus size="16" style={{ color: "inherit" }} />
          Write a post
        </Button>
      </div>
      <Table
        headers={HEADERS}
        rows={rows}
        isLoading={isLoading}
        isWithoutSorting
        mobileHeadField="title"
        columnStyles={{
          title: { width: "40%", minWidth: 220 },
          game: { minWidth: 140 },
        }}
        onRowClick={(index) =>
          articles[index] && router.push(`/admin/news/${articles[index]._id}`)
        }
      />
      {(data?.total ?? 0) > ARTICLES_TAKE_MAX && (
        <Pagination
          take={ARTICLES_TAKE_MAX}
          total={data?.total ?? 0}
          page={page}
          onPageChange={setPage}
          isDisabled={isLoading}
        />
      )}
    </div>
  );
};
