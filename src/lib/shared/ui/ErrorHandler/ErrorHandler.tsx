"use client";

import { useEffect } from "react";
import { initGlobalErrorHandlers } from "../../utils/error-handler.utils";

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
