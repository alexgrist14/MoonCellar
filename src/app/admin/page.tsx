import { FC, lazy } from "react";

const Admin = lazy(() => import("@/src/lib/pages/Admin/Admin"));

const AdminPage: FC = async () => {
  return <Admin />;
};

export default AdminPage;
