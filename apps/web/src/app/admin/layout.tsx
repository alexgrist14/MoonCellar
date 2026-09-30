import { ReactNode } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import {
  ACCESS_TOKEN,
  API_URL,
  REFRESH_TOKEN,
} from "@/src/lib/shared/constants";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();

  if (!cookieStore.has(ACCESS_TOKEN) && !cookieStore.has(REFRESH_TOKEN)) {
    notFound();
  }

  const response = await fetch(`${API_URL}/admin/access`, {
    headers: { Cookie: cookieStore.toString() },
    cache: "no-store",
  }).catch(() => null);

  if (
    response?.status === 403 ||
    (response?.status === 401 && !cookieStore.has(REFRESH_TOKEN))
  ) {
    notFound();
  }

  return children;
}
