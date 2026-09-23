import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  profileTabLabels,
  profileTabs,
} from "@/src/lib/shared/constants/user.const";
import { getProfileHref } from "@/src/lib/shared/utils/links.utils";
import { getProfileUser } from "../profile.data";

type ITabPageProps = { params: Promise<{ name: string; tab: string }> };

export async function generateMetadata({
  params,
}: ITabPageProps): Promise<Metadata> {
  const { name, tab } = await params;
  const user = await getProfileUser(name);

  if (!user || !profileTabs.includes(tab)) return {};

  return {
    title: `${profileTabLabels[tab]}: ${user.userName}`,
    alternates: { canonical: getProfileHref(user.userName, tab) },
    ...(tab === "settings" && { robots: { index: false, follow: false } }),
  };
}

export default async function ProfileTabPage({ params }: ITabPageProps) {
  if (!profileTabs.includes((await params).tab)) notFound();

  return null;
}
