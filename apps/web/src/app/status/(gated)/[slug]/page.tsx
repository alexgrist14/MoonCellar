import { StatusProjectPage } from "@/src/lib/pages/StatusProjectPage";

export default async function StatusProjectRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <StatusProjectPage slug={slug} />;
}
