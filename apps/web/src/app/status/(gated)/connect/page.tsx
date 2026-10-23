import { Suspense } from "react";
import { Metadata } from "next";
import { StatusConnectPage } from "@/src/lib/pages/StatusConnectPage";

export const metadata: Metadata = { title: "Connect" };

export default function StatusConnectRoute() {
  return (
    <Suspense>
      <StatusConnectPage />
    </Suspense>
  );
}
