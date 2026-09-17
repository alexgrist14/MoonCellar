import { BadRequestException } from "@nestjs/common";
import mongoose from "mongoose";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeListName = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

export const slugifyListName = (name: string) => {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  return slug || "list";
};

export const toObjectId = (id: string, label = "id") => {
  if (!OBJECT_ID_PATTERN.test(String(id))) {
    throw new BadRequestException(`Invalid ${label}`);
  }

  return new mongoose.Types.ObjectId(String(id));
};

export const toIsoString = (value: unknown) =>
  value instanceof Date
    ? value.toISOString()
    : typeof value === "string"
      ? value
      : new Date(0).toISOString();
