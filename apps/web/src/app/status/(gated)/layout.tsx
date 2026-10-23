import { ReactNode } from "react";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/src/lib/shared/constants";
import { StatusNoAccessPage } from "@/src/lib/pages/StatusNoAccessPage";
import { getAdminAccessStatus } from "@/src/lib/shared/utils/admin-access.utils";
import { StatusGate } from "@/src/lib/widgets/status/StatusGate";
import {
  IStatusViewer,
  StatusShell,
} from "@/src/lib/widgets/status/StatusShell";

export default async function StatusGatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN)?.value;

  if (!accessToken && !cookieStore.has(REFRESH_TOKEN)) {
    return <StatusGate state="signedOut" />;
  }

  const status = await getAdminAccessStatus(cookieStore.toString());

  if (status === 401 || !accessToken) {
    return (
      <StatusGate
        state={cookieStore.has(REFRESH_TOKEN) ? "expired" : "signedOut"}
      />
    );
  }

  if (status === null || status >= 500) {
    throw new Error(
      "The MoonCellar API could not be reached. Try again in a minute."
    );
  }

  const { id, userName } = jwtDecode<IStatusViewer>(accessToken);

  if (status === 403) return <StatusNoAccessPage viewer={{ id, userName }} />;

  return <StatusShell viewer={{ id, userName }}>{children}</StatusShell>;
}
