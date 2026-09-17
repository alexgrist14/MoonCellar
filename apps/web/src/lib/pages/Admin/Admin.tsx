"use client";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "../../shared/store/auth.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import UserList from "./User/UserList/UserList";
import GameList from "./Game/GameList";
import ReportList from "./Reports/ReportList/ReportList";
import VndbCandidates from "./VndbCandidates/VndbCandidates";
import { ADMIN_TABS, getAdminTabIndex, setAdminQuery } from "./admin-url";

const Admin = () => {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const searchParams = useSearchParams();
  const tabIndex = getAdminTabIndex(searchParams.get("tab"));

  if (!isAdmin) return;

  const selectTab = (index: number) =>
    setAdminQuery({ tab: ADMIN_TABS[index], vn: null });

  return (
    <Box>
      <Tabs
        defaultTabIndex={tabIndex}
        isUseDefaultIndex
        contents={[
          { tabName: "Users", onTabClick: () => selectTab(0) },
          { tabName: "Games", onTabClick: () => selectTab(1) },
          { tabName: "Reports", onTabClick: () => selectTab(2) },
          { tabName: "VNDB candidates", onTabClick: () => selectTab(3) },
        ]}
      />
      {tabIndex === 0 && <UserList />}
      {tabIndex === 1 && <GameList />}
      {tabIndex === 2 && <ReportList />}
      {tabIndex === 3 && <VndbCandidates />}
    </Box>
  );
};

export default Admin;
