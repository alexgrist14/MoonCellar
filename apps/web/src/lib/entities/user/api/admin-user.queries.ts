import { useQuery } from "@tanstack/react-query";
import { adminUserQueryKeys } from "./admin-user.query-keys";
import { adminUsersApi } from "@/src/lib/shared/api";

export const useAdminUsersQuery = () => {
  return useQuery({
    queryKey: adminUserQueryKeys.list(),
    queryFn: () => adminUsersApi.getUsers().then(({ data }) => data),
  });
};
