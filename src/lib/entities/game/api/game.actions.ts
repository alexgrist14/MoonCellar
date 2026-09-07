"use server";

import { revalidatePath } from "next/cache";

export const revalidateGamePage = async (...slugs: (string | undefined)[]) => {
  const unique = new Set(slugs.filter((slug): slug is string => !!slug));

  for (const slug of unique) {
    revalidatePath(`/games/${slug}`);
  }
};
