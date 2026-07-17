"use client";
import { useAuthStore } from "../../shared/store/auth.store";
import UserList from "./User/UserList/UserList";

const Admin = () => {
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (!isAdmin) return;

  return <UserList />;
};

export default Admin;
