import { redirect } from "next/navigation";
import {
  getAdminHref,
  isAdminTab,
} from "@/src/lib/shared/utils/admin-url.utils";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const { tab, ...rest } = await searchParams;
  const query = new URLSearchParams(
    Object.entries(rest).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : []
    )
  ).toString();
  const href = getAdminHref(
    typeof tab === "string" && isAdminTab(tab) ? tab : "users"
  );

  redirect(query ? `${href}?${query}` : href);
};

export default AdminPage;
