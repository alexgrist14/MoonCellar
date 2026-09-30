import { Suspense } from "react";
import { Admin } from "@/src/lib/pages/Admin";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";

const AdminTabPage = () => (
  <Suspense fallback={<PageLoader />}>
    <Admin tab="sites" />
  </Suspense>
);

export default AdminTabPage;
