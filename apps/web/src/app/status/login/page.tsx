import { Suspense } from "react";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/src/lib/shared/constants";
import { StatusLoginPage } from "@/src/lib/pages/StatusLoginPage";
import { getAdminAccessStatus } from "@/src/lib/shared/utils/admin-access.utils";
import { isSafeStatusPath } from "@/src/lib/shared/utils/status-path.utils";

export const metadata: Metadata = { title: "Sign in" };

export default async function StatusLoginRoute({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.has(ACCESS_TOKEN) || cookieStore.has(REFRESH_TOKEN)) {
    if ((await getAdminAccessStatus(cookieStore.toString())) === 200) {
      const { next } = await searchParams;
      redirect(isSafeStatusPath(next) ? next : "/");
    }
  }

  return (
    <Suspense>
      <StatusLoginPage />
    </Suspense>
  );
}
