import { useSyncExternalStore } from "react";
import {
  canPromptInstall,
  isStandalone,
  promptInstall,
  subscribeInstallPrompt,
} from "@/src/lib/shared/utils/install.utils";

export const useInstallApp = () => {
  const canInstall = useSyncExternalStore(
    subscribeInstallPrompt,
    canPromptInstall,
    () => false
  );
  const isInstalled = useSyncExternalStore(
    () => () => undefined,
    isStandalone,
    () => false
  );

  return { canInstall, isInstalled, install: promptInstall };
};
