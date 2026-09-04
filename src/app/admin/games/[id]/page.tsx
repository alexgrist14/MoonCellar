import GameEditPage from "@/src/lib/pages/Admin/Game/GameEditPage";
import { Suspense } from "react";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";

const AdminGameEditPage = async ({ params }: { params: any }) => {
  const { id } = await params;

  return (
    <Suspense fallback={<PageLoader />}>
      <GameEditPage gameId={id === "new" ? undefined : id} />
    </Suspense>
  );
};

export default AdminGameEditPage;
