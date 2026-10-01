"use client";

import { ProgressProvider } from "@bprogress/next/app";

const Providers = ({ children }: { children: React.ReactNode }) => {
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
