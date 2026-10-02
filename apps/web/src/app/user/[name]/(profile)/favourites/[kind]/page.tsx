import { Metadata } from "next";
import { notFound } from "next/navigation";
import { profileTabs } from "@/src/lib/shared/constants/user.const";
import { getProfileTabMetadata } from "../../profile.data";

type IFavouritesPageProps = {
  params: Promise<{ name: string; kind: string }>;
};

export async function generateMetadata({
  params,
}: IFavouritesPageProps): Promise<Metadata> {
  const { name, kind } = await params;

  return getProfileTabMetadata(name, `favourites/${kind}`);
}

export default async function FavouritesPage({ params }: IFavouritesPageProps) {
  if (!profileTabs.includes(`favourites/${(await params).kind}`)) notFound();

  return null;
}
