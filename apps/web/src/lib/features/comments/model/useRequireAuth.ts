import { useCallback } from "react";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { openAuthModal } from "@/src/lib/shared/ui/AuthModal";
import { IUser } from "@/src/lib/shared/types/auth.type";

export const useRequireAuth = () =>
  useCallback((action: (profile: IUser) => void) => {
    const { profile } = useAuthStore.getState();

    if (!profile?._id) {
      openAuthModal();
      return;
    }

    action(profile);
  }, []);
