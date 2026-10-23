"use server";

import { revalidatePath } from "next/cache";

export const revalidateArticlePage = async (
  ...slugs: (string | undefined)[]
) => {
  const unique = [...new Set(slugs.filter((slug): slug is string => !!slug))];

  for (const slug of unique) {
    revalidatePath(`/news/${slug}`);
  }

  return unique;
};
