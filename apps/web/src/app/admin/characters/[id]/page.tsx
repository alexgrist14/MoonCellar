import { Suspense } from "react";
import { CharacterEditPage } from "@/src/lib/pages/CharacterEditPage";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";

const AdminCharacterEditPage = async ({ params }: { params: any }) => {
  const { id } = await params;

  return (
    <Suspense fallback={<PageLoader />}>
      <CharacterEditPage characterId={id === "new" ? undefined : id} />
    </Suspense>
  );
};

export default AdminCharacterEditPage;
