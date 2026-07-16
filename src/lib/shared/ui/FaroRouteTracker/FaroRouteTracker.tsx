"use client";

import { faro } from "@grafana/faro-web-sdk";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export const FaroRouteTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    faro.api?.pushEvent("page_view", { route: pathname });
  }, [pathname]);

  return null;
};
