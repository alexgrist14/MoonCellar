import { createHash } from "node:crypto";
import type { IArticleArchive } from "@mooncellar/schemas";

const WORDS_PER_MINUTE = 200;
const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|curl|wget|python|axios|node-fetch/i;

export const ARTICLE_VIEW_WINDOW_SECONDS = 30 * 60;

export interface IArticleVisitor {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export const getArticleVisitorKey = ({
  userId,
  ip,
  userAgent,
}: IArticleVisitor) => {
  if (!userAgent || BOT_USER_AGENT_PATTERN.test(userAgent)) return null;

  const identity = userId ? `user:${userId}` : `ip:${ip ?? ""}|${userAgent}`;

  return createHash("sha256").update(identity).digest("hex");
};

export const slugifyArticleTitle = (title: string) => {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || "post";
};

export const countReadingMinutes = (html: string) => {
  const words = html
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

export const getPublishedRange = (year: number, month?: number) => ({
  $gte: new Date(Date.UTC(year, month ? month - 1 : 0, 1)),
  $lt: new Date(month ? Date.UTC(year, month, 1) : Date.UTC(year + 1, 0, 1)),
});

export const buildArticleArchive = (
  rows: { year: number; month: number; count: number }[]
): IArticleArchive => {
  const years = new Map<number, IArticleArchive["years"][number]>();

  for (const { year, month, count } of rows) {
    const entry = years.get(year) ?? { year, count: 0, months: [] };

    entry.count += count;
    entry.months.push({ month, count });
    years.set(year, entry);
  }

  const sorted = [...years.values()]
    .map((entry) => ({
      ...entry,
      months: entry.months.sort((a, b) => b.month - a.month),
    }))
    .sort((a, b) => b.year - a.year);

  return {
    total: sorted.reduce((sum, entry) => sum + entry.count, 0),
    years: sorted,
  };
};
