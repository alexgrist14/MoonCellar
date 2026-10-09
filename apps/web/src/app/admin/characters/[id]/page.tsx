import { Suspense } from "react";
import { CharacterEditPage } from "@/src/lib/pages/CharacterEditPage";
import { PageSkeleton } from "@/src/lib/shared/ui/PageSkeleton";

const AdminCharacterEditPage = async ({ params }: { params: any }) => {
  const { id } = await params;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <CharacterEditPage characterId={id === "new" ? undefined : id} />
    </Suspense>
  );
};

export default AdminCharacterEditPage;
