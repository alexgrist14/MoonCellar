import type mongoose from "mongoose";
import type { Model } from "mongoose";
import type { CustomList } from "../schemas/custom-list.schema";
import { escapeRegExp, slugifyListName } from "./collections.utils";

export const findFreeListSlug = async (
  listModel: Model<CustomList>,
  userId: mongoose.Types.ObjectId,
  name: string,
  exceptId?: mongoose.Types.ObjectId
) => {
  const base = slugifyListName(name);
  const pattern = `^${escapeRegExp(base)}(-\\d+)?$`;
  const taken = await listModel
    .find({
      userId,
      ...(exceptId ? { _id: { $ne: exceptId } } : {}),
      $or: [
        { slug: { $regex: pattern } },
        { previousSlugs: { $regex: pattern } },
      ],
    })
    .select("slug previousSlugs")
    .lean();
  const used = new Set(
    taken.flatMap((list) => [list.slug, ...(list.previousSlugs ?? [])])
  );

  if (!used.has(base)) return base;

  let suffix = 2;

  while (used.has(`${base}-${suffix}`)) suffix += 1;

  return `${base}-${suffix}`;
};
