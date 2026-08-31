"use client";

import { useEffect } from "react";
import { NotFoundPage } from "@/src/lib/pages/NotFoundPage";
import { logger } from "@/src/lib/shared/utils/logger.utils";

export default function UserRouteError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    logger.error("User page route error", error, {
      digest: error.digest,
      name: error.name,
      message: error.message,
    });
  }, [error]);

  return <NotFoundPage />;
}
