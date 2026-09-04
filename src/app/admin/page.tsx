import Admin from "@/src/lib/pages/Admin/Admin";
import { FC, Suspense } from "react";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";

const AdminPage: FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Admin />
    </Suspense>
  );
};

export default AdminPage;
