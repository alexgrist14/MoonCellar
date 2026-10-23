import { API_URL } from "@/src/lib/shared/constants";

export const getAdminAccessStatus = async (cookie: string) => {
  const response = await fetch(`${API_URL}/admin/access`, {
    headers: { Cookie: cookie },
    cache: "no-store",
  }).catch(() => null);
  return response?.status ?? null;
};
