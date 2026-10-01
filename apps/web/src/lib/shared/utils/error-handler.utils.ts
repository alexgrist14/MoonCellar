import { logger } from "./logger.utils";

export function initGlobalErrorHandlers(): () => void {
  if (typeof window === "undefined") return () => {};

  const onError = (event: ErrorEvent) => {
    logger.error("Uncaught error", event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      type: "uncaught",
    });
  };

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    logger.error("Unhandled promise rejection", event.reason, {
      type: "unhandledrejection",
      promise: event.promise?.toString(),
    });
  };

  const onResourceError = (event: Event) => {
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
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onResourceError, true);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    window.removeEventListener("error", onResourceError, true);
  };
}
