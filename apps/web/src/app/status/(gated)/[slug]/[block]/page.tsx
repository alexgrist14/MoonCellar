import { StatusProjectPage } from "@/src/lib/pages/StatusProjectPage";

export default async function StatusProjectBlockRoute({
  params,
}: {
  params: Promise<{ slug: string; block: string }>;
}) {
  const { slug, block } = await params;
  return <StatusProjectPage slug={slug} block={block} />;
}
