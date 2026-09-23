import { permanentRedirect } from "next/navigation";
import { profileTabs } from "@/src/lib/shared/constants/user.const";
import { getProfileHref } from "@/src/lib/shared/utils/links.utils";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { list, ...rest } = await searchParams;

  if (typeof list === "string" && profileTabs.includes(list)) {
    const query = new URLSearchParams(
      Object.entries(rest).flatMap(([key, value]) =>
        (Array.isArray(value) ? value : [value])
          .filter((item): item is string => item !== undefined)
          .map((item) => [key, item])
      )
    ).toString();

    permanentRedirect(
      getProfileHref((await params).name, list) + (query ? `?${query}` : "")
    );
  }

  return null;
}
