import { useGeoStore } from "../store/geo.store";
import { useAuthStore } from "../store/auth.store";

export const useHideAdult = (): boolean => {
  const blockedCountry = useGeoStore((s) => s.blockedCountry);
  const resolved = useGeoStore((s) => s.resolved);
  const setting = useAuthStore(
    (s) => s.profile?.settings?.hideAdultContent ?? false
  );

  return setting || !resolved || blockedCountry;
};
