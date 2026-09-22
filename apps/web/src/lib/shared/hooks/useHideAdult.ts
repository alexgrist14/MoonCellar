import { useGeoStore } from "@/src/lib/shared/store/geo.store";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";

export const useHideAdult = (): boolean => {
  const blockedCountry = useGeoStore((s) => s.blockedCountry);
  const resolved = useGeoStore((s) => s.resolved);
  const setting = useAuthStore(
    (s) => s.profile?.settings?.showAdultContent ?? false
  );

  return !setting || !resolved || blockedCountry;
};
