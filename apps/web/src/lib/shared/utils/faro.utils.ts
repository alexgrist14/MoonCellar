import { getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { API_URL } from "../constants";

let initialized = false;

export function initFaro(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  initializeFaro({
    url: `${API_URL}/faro`,
    app: {
      name: process.env.NEXT_PUBLIC_FARO_APP_NAME || "mooncellar-frontend",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0",
      environment: process.env.NODE_ENV || "development",
    },
    instrumentations: [...getWebInstrumentations()],
  });
}
