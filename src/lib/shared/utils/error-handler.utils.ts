import { logger } from "./logger.utils";

/**
 * Инициализирует глобальные обработчики ошибок для логирования в Grafana
 */
export function initGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;

  // Обработка синхронных ошибок
  window.addEventListener("error", (event) => {
    logger.error("Uncaught error", event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: "uncaught",
    });
  });

  // Обработка необработанных промисов
  window.addEventListener("unhandledrejection", (event) => {
    logger.error("Unhandled promise rejection", event.reason, {
      type: "unhandledrejection",
      promise: event.promise?.toString(),
    });
  });

  // Обработка ошибок загрузки ресурсов
  window.addEventListener(
    "error",
    (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        logger.error(
          "Resource loading error",
          new Error("Resource failed to load"),
          {
            tagName: target.tagName,
            src:
              target instanceof HTMLImageElement ||
              target instanceof HTMLScriptElement
                ? target.src
                : undefined,
            href: target instanceof HTMLLinkElement ? target.href : undefined,
            type: "resource",
          }
        );
      }
    },
    true
  ); // Используем capture phase для перехвата всех ошибок
}
