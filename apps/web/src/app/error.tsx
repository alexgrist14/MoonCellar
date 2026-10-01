"use client";

import { useEffect } from "react";
import { ErrorPage } from "@/src/lib/pages/ErrorPage";
import { logger } from "@/src/lib/shared/utils/logger.utils";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    logger.error("Next.js route error", error, {
      digest: error.digest,
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return <ErrorPage onRetry={retry} />;
}
