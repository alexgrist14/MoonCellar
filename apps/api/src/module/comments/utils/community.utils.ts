import { BadRequestException } from "@nestjs/common";
import mongoose from "mongoose";
import { RolesEnum } from "@mooncellar/schemas";
import { type IObjectIdLike, type IViewer } from "../types/community.type";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const asObjectId = (id: IObjectIdLike) =>
  new mongoose.Types.ObjectId(String(id));

export const asObjectIds = (ids: IObjectIdLike[]) => ids.map(asObjectId);

export const toObjectId = (id: string, label: string) => {
  if (!OBJECT_ID_PATTERN.test(id)) {
    throw new BadRequestException(`Invalid ${label}`);
  }

  return new mongoose.Types.ObjectId(id);
};

export const getViewerId = (viewer: IViewer) =>
  viewer ? (viewer._id as mongoose.Types.ObjectId) : null;

export const isAdminViewer = (viewer: IViewer) =>
  !!viewer?.roles?.includes(RolesEnum.ADMIN);

export const isSameId = (first: unknown, second: unknown) =>
  String(first) === String(second);

export const isDuplicateKeyError = (error: unknown) =>
  (error as { code?: number } | null)?.code === 11000;

export const uniqueIds = (ids: (IObjectIdLike | null | undefined)[]) => [
  ...new Map(
    ids
      .filter((id): id is IObjectIdLike => !!id)
      .map((id) => [String(id), id])
  ).values(),
];

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

export const getPlainTextExcerpt = (
  html: string | undefined,
  maxLength: number
) => {
  const text = (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(?:amp|lt|gt|quot|#39|nbsp);/g,
      (entity) => HTML_ENTITIES[entity] ?? entity
    )
    .replace(/\s+/g, " ")
    .trim();

  return text.length > maxLength
    ? `${text.slice(0, maxLength).trimEnd()}…`
    : text;
};
