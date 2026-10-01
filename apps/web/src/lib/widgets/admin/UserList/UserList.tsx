import { adminUsersApi } from "@/src/lib/shared/api";
import { FC, useCallback, useEffect, useId, useState } from "react";
import { Table } from "@/src/lib/shared/ui/Table";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import styles from "./UserList.module.scss";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { IRole } from "@mooncellar/schemas";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { ActionsMenu } from "@/src/lib/shared/ui/ActionsMenu";
import { modal } from "@/src/lib/shared/ui/Modal";
import { useAdminUsersQuery } from "@/src/lib/entities/user/api/admin-user.queries";
import {
  useDeleteAdminUserMutation,
  useUpdateAdminUserRolesMutation,
} from "@/src/lib/entities/user/api/admin-user.mutations";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";

const ALL_ROLES: IRole[] = ["user", "admin", "moderator"];

export const UserList: FC = () => {
  const tableId = useId();
  const router = useRouter();
  const { data: users = [], isLoading } = useAdminUsersQuery();
  const currentUser = useAuthStore((state) => state.profile);
  const { mutate: updateUserRoles, isPending: isUpdatingRoles } =
    useUpdateAdminUserRolesMutation();
  const { mutate: deleteUser, isPending: isDeletingUser } =
    useDeleteAdminUserMutation();

  const handleRolesChange = useCallback(
    async (userId: string, currentRoles: IRole[], newIndexes: number[]) => {
      const newRoles = newIndexes.map((i) => ALL_ROLES[i]);

      const isCurrentUser = userId === currentUser?._id;
      if (
        isCurrentUser &&
        currentRoles.includes("admin") &&
        !newRoles.includes("admin")
      ) {
        return;
      }

      const addedRoles = newRoles.filter((r) => !currentRoles.includes(r));
      const removedRoles = currentRoles.filter((r) => !newRoles.includes(r));

      updateUserRoles({ userId, currentRoles, newRoles });
    },
    [currentUser?._id, updateUserRoles]
  );

  const handleDeleteUser = useCallback(
    async (userId: string, userName: string) => {
      const modalId = `delete-user-${userId}`;

      modal.open(
        <ConfirmModal
          title="Delete User"
          message={
            <p>
              Are you sure you want to delete user <strong>{userName}</strong>?
            </p>
          }
          warning="This will permanently delete the user and all related data (logs, ratings, playthroughs)."
          onConfirm={() =>
            deleteUser(userId, {
              onSuccess: () => {
                modal.close(modalId);
                toast.success({
                  title: "User deleted successfully",
                  description: `User ${userName} deleted successfully`,
                });
              },
            })
          }
          onCancel={() => modal.close(modalId)}
        />,
        { id: modalId }
      );
    },
    [deleteUser]
  );

  return (
    <div id={tableId}>
      <Table
        mobileHeadField="userName"
        isLoading={isLoading}
        headers={{
          userName: { content: "User" },
          raUsername: { content: "RA Username" },
          roles: { content: "Roles" },
          created: { content: "Created" },
          actions: { content: "Actions" },
        }}
        onRowClick={(index) => router.push(`/user/${users[index].userName}`)}
        rowClickExcludeKeys={["roles", "actions"]}
        rows={users.map((user) => {
          const href = `/user/${user.userName}`;
          const isCurrentUser = user._id === currentUser?._id;
          return {
            userName: {
              content: (
                <div className={styles.container}>
                  <div className={styles.avatar}>
                    <Avatar user={user} isWithoutTooltip />
                  </div>
                  <div className={styles.description}>
                    <span className={styles.name}>{user.userName}</span>
                    <span className={styles.email}>{user.email}</span>
                  </div>
                </div>
              ),
              sortingValue: user.userName,
            },
            raUsername: { content: user.raUsername || "N/A" },

            roles: {
              content: (
                <div className={styles.fill}>
                  <Dropdown
                    list={ALL_ROLES}
                    placeholder="Select roles"
                    overwriteValue={
                      user.roles?.length ? user.roles.join(", ") : "No roles"
                    }
                    overflowRootId={tableId}
                    isWithAll
                    isMulti
                    initialMultiValue={
                      user.roles?.map((role) =>
                        ALL_ROLES.indexOf(role as IRole)
                      ) || []
                    }
                    getIndexes={(indexes) =>
                      handleRolesChange(
                        user._id,
                        (user.roles as IRole[]) || [],
                        indexes
                      )
                    }
                    isWithReset
                    isThroughPortal
                  />
                </div>
              ),
            },
            created: {
              content: commonUtils.formatDate(user.createdAt, {
                isWithTime: true,
              }),
              sortingValue: new Date(user.createdAt).getTime(),
            },
            actions: {
              content: (
                <ActionsMenu
                  items={[
                    {
                      label: "Open in a new tab",
                      onClick: () => window.open(href, "_blank"),
                    },
                    {
                      label: isCurrentUser
                        ? "You cannot delete yourself"
                        : "Delete",
                      isDanger: true,
                      isDisabled: isCurrentUser,
                      onClick: () => handleDeleteUser(user._id, user.userName),
                    },
                  ]}
                />
              ),
            },
          };
        })}
      />
    </div>
  );
};
