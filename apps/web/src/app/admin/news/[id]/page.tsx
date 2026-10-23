import { Suspense } from "react";
import { ArticleEditPage } from "@/src/lib/pages/ArticleEditPage";
import { PageSkeleton } from "@/src/lib/shared/ui/PageSkeleton";

const AdminArticleEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <ArticleEditPage articleId={id === "new" ? undefined : id} />
    </Suspense>
  );
};

export default AdminArticleEditPage;
