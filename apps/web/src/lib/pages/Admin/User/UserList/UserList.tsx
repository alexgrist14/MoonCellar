import { adminUsersApi } from "@/src/lib/shared/api";
import { FC, useCallback, useEffect, useId, useState } from "react";
import { Table } from "@/src/lib/shared/ui/Table";
import { SvgProfile } from "@/src/lib/shared/ui/svg";
import Image from "next/image";
import styles from "./UserList.module.scss";
import { IUser } from "@/src/lib/shared/types/auth.type";
import Link from "next/link";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { IRole } from "@/src/lib/shared/lib/schemas/role.schema";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { modal } from "@/src/lib/shared/ui/Modal";
import { useAdminUsersQuery } from "@/src/lib/entities/user/api/admin-user.queries";
import {
  useDeleteAdminUserMutation,
  useUpdateAdminUserRolesMutation,
} from "@/src/lib/entities/user/api/admin-user.mutations";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { toast } from "@/src/lib/shared/utils/toast.utils";

const ALL_ROLES: IRole[] = ["user", "admin", "moderator"];

const UserList: FC = () => {
  const tableId = useId();
  const { data: users = [], isPending } = useAdminUsersQuery();
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
        headers={{
          userName: { content: "User" },
          raUsername: { content: "RA Username" },
          roles: { content: "Roles" },
          rolesEdit: { content: "Edit Roles" },
          created: { content: "Created" },
          actions: { content: "Actions" },
        }}
        rows={users?.map((user) => ({
          userName: {
            content: (
              <Link
                href={`/user/${user.userName}`}
                className={styles.container}
                target="_blank"
              >
                <div className={styles.avatar}>
                  {user?.avatar ? (
                    <Image
                      className={styles.image}
                      src={user.avatar}
                      width={48}
                      height={48}
                      alt="profile"
                    />
                  ) : (
                    <div className={styles.placeholder__container}>
                      <SvgProfile className={styles.placeholder} />
                    </div>
                  )}
                </div>
                <div className={styles.description}>
                  <h3>{user.userName}</h3>
                  <p>{user.email}</p>
                </div>
              </Link>
            ),
          },
          raUsername: { content: user.raUsername || "N/A" },

          roles: {
            content: user.roles?.length ? (
              <div>
                {user.roles.map((role) => (
                  <span
                    key={role}
                    className={`${styles.role} ${styles[`role_${role}`] || ""}`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            ) : (
              "No roles assigned"
            ),
          },

          rolesEdit: {
            content: (
              <Dropdown
                list={ALL_ROLES}
                placeholder="Select roles"
                overwriteValue={
                  user.roles?.length
                    ? `Selected ${user.roles.length} roles`
                    : "No roles selected"
                }
                overflowRootId={tableId}
                isWithAll
                isMulti
                initialMultiValue={
                  user.roles?.map((role) => ALL_ROLES.indexOf(role as IRole)) ||
                  []
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
            ),
          },
          created: {
            content: new Intl.DateTimeFormat("ru-RU", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
            }).format(new Date(user.createdAt)),
          },
          actions: {
            content: (
              <Button
                color={ButtonColor.RED}
                onClick={() => handleDeleteUser(user._id, user.userName)}
                disabled={user._id === currentUser?._id}
                tooltip={
                  user._id === currentUser?._id
                    ? "You cannot delete yourself"
                    : undefined
                }
              >
                Delete
              </Button>
            ),
          },
        }))}
      />
    </div>
  );
};

export default UserList;
