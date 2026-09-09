import { useQuery } from "@tanstack/react-query";
import { platformsAPI } from "@/src/lib/shared/api/platforms.api";
import { platformQueryKeys } from "./platform.query-keys";

export const usePlatformsQuery = () =>
  useQuery({
    queryKey: platformQueryKeys.list(),
    queryFn: () => platformsAPI.getAll().then(({ data }) => data),
    staleTime: Infinity,
  });
