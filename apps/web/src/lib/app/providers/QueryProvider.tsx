"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { isAxiosError } from "axios";
import { ReactNode, useState } from "react";

const MAX_QUERY_RETRIES = 3;

const shouldRetryQuery = (failureCount: number, error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined;

  if (status && status >= 400 && status < 500) return false;

  return failureCount < MAX_QUERY_RETRIES;
};

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: shouldRetryQuery } },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />{" "}
      {children}
    </QueryClientProvider>
  );
};
