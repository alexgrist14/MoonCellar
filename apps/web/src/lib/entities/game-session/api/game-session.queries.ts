import { useQuery } from "@tanstack/react-query";
import { gameAuthApi } from "@/src/lib/shared/api";
import { gameSessionQueryKeys } from "./game-session.query-keys";

export const useGameSessionsQuery = (isEnabled = true) =>
  useQuery({
    queryKey: gameSessionQueryKeys.list(),
    queryFn: () => gameAuthApi.getSessions().then(({ data }) => data),
    enabled: isEnabled,
  });

export const useGameDeviceLinkQuery = (userCode: string | null) =>
  useQuery({
    queryKey: gameSessionQueryKeys.link(userCode ?? ""),
    queryFn: () => gameAuthApi.getLink(userCode!).then(({ data }) => data),
    enabled: !!userCode,
    retry: false,
  });
