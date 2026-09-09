import { adminUsersApi } from "@/src/lib/shared/api";
import { IRole } from "@/src/lib/shared/lib/schemas/role.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUserQueryKeys } from "./admin-user.query-keys";
import { IUser } from "@/src/lib/shared/lib/schemas/user.schema";

interface IUpdateAdminUserRoles {
  userId: string;
  currentRoles: IRole[];
  newRoles: IRole[];
}

export const useUpdateAdminUserRolesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      currentRoles,
      newRoles,
    }: IUpdateAdminUserRoles) => {
      const addedRoles = newRoles.filter(
        (role) => !currentRoles.includes(role)
      );
      const removedRoles = currentRoles.filter(
        (role) => !newRoles.includes(role)
      );

      await Promise.all([
        ...addedRoles.map((role) => adminUsersApi.addUserRole(userId, role)),
        ...removedRoles.map((role) =>
          adminUsersApi.removeUserRole(userId, role)
        ),
      ]);

      return { userId, newRoles };
    },
    onSuccess: ({ userId, newRoles }) => {
      queryClient.setQueryData<IUser[]>(adminUserQueryKeys.list(), (users) =>
        users?.map((user) =>
          user._id === userId ? { ...user, roles: newRoles } : user
        )
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: adminUserQueryKeys.list() });
    },
  });
};

export const useDeleteAdminUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await adminUsersApi.deleteUser(userId);
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.setQueryData<IUser[]>(adminUserQueryKeys.list(), (users) =>
        users?.filter((user) => user._id !== userId)
      );
    },
  });
};
