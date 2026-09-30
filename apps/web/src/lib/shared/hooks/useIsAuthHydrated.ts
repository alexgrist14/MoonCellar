
import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";

export const useIsAuthHydrated = () =>
  useSyncExternalStore(
    (onChange) => useAuthStore.persist.onFinishHydration(onChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  );
