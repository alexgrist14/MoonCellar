import { ReactNode } from "react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { STATUS_HOST_PREFIX } from "@/src/lib/shared/constants";

export const metadata: Metadata = {
  title: { default: "Status", template: "%s | Status" },
  robots: { index: false, follow: false },
};

export default async function StatusLayout({
  children,
}: {
  children: ReactNode;
}) {
  const host = (await headers()).get("host") ?? "";
  if (!host.startsWith(STATUS_HOST_PREFIX)) notFound();
  return children;
}
