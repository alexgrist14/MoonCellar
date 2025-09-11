import Admin from "@/src/lib/pages/Admin/Admin";
import { ACCESS_TOKEN } from "@/src/lib/shared/constants";
import { IAuthToken } from "@/src/lib/shared/types/auth.type";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { FC } from "react";

const AdminPage: FC = async () => {
  const cookie = await cookies();
  const accessToken = cookie.get(ACCESS_TOKEN);
  const authUserInfo: IAuthToken | undefined = !!accessToken?.value
    ? jwtDecode(accessToken.value)
    : undefined;
  if (!authUserInfo || !authUserInfo.roles.includes("admin")) {
    notFound();
  }
  return <Admin />;
};

export default AdminPage;
