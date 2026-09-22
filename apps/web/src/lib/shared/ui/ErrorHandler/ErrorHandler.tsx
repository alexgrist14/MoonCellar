"use client";

import { useEffect } from "react";
import { initGlobalErrorHandlers } from "@/src/lib/shared/utils/error-handler.utils";

/**
 * Компонент для инициализации глобальных обработчиков ошибок
 * Должен быть добавлен в корневой layout
 */
export function ErrorHandler() {
  useEffect(() => {
    initGlobalErrorHandlers();
  }, []);

  return null;
}
