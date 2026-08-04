"use client";
import { useState } from "react";
import { useAuthStore } from "../../shared/store/auth.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import UserList from "./User/UserList/UserList";
import GameList from "./Game/GameList";

const Admin = () => {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [tabIndex, setTabIndex] = useState(0);

  if (!isAdmin) return;

  return (
    <Box wrapperStyle={{maxHeight: 'calc(100vh - 38 * var(--padding-x1)'}} templateStyle={{borderRadius: 'var(--radius-x5) var(--radius-x5) 0 0'}}>
      <Tabs
        defaultTabIndex={tabIndex}
        contents={[
          { tabName: "Users", onTabClick: () => setTabIndex(0) },
          { tabName: "Games", onTabClick: () => setTabIndex(1) },
        ]}
      />
      {tabIndex === 0 ? <UserList /> : <GameList />}
    </Box>
  );
};

export default Admin;
