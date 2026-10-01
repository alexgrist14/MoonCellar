"use client";

import { useEffect } from "react";
import { initGlobalErrorHandlers } from "@/src/lib/shared/utils/error-handler.utils";

export function ErrorHandler() {
  useEffect(() => initGlobalErrorHandlers(), []);

  return null;
}
