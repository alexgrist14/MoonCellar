import { Suspense } from "react";
import { Admin } from "@/src/lib/pages/Admin";
import { PageSkeleton } from "@/src/lib/shared/ui/PageSkeleton";

const AdminTabPage = () => (
  <Suspense fallback={<PageSkeleton />}>
    <Admin tab="users" />
  </Suspense>
);

export default AdminTabPage;
