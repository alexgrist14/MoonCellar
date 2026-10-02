"use client";

import { useEffect } from "react";
import { ProgressProvider } from "@bprogress/next/app";
import { SERVICE_WORKER_URL } from "@/src/lib/shared/utils/push.utils";
import { listenInstallPrompt } from "@/src/lib/shared/utils/install.utils";

const Providers = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    listenInstallPrompt();

    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: "/" })
      .catch(() => undefined);
  }, []);

  return (
    <ProgressProvider
      height="2px"
      color="var(--color-yellow-light)"
      style=""
      delay={150}
      options={{ showSpinner: false }}
    >
      {children}
    </ProgressProvider>
  );
};

export default Providers;
