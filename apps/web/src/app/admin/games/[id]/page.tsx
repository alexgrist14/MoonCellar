import { GameEditPage } from "@/src/lib/pages/GameEditPage";
import { Suspense } from "react";
import { PageSkeleton } from "@/src/lib/shared/ui/PageSkeleton";

const AdminGameEditPage = async ({ params }: { params: any }) => {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <GameEditPage gameId={id === "new" ? undefined : id} />
    </Suspense>
  );
};

export default AdminGameEditPage;
