import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  legacyProfileTabs,
  profileTabs,
} from "@/src/lib/shared/constants/user.const";
import { getProfileHref } from "@/src/lib/shared/utils/links.utils";
import { getProfileTabMetadata } from "../profile.data";

type ITabPageProps = { params: Promise<{ name: string; tab: string }> };

export async function generateMetadata({
  params,
}: ITabPageProps): Promise<Metadata> {
  const { name, tab } = await params;

  return getProfileTabMetadata(name, tab);
}

export default async function ProfileTabPage({ params }: ITabPageProps) {
  const { name, tab } = await params;

  if (legacyProfileTabs[tab]) {
    permanentRedirect(getProfileHref(name, legacyProfileTabs[tab]));
  }

  if (!profileTabs.includes(tab)) notFound();

  return null;
}
