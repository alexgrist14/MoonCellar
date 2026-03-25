import { adminUsersApi } from "@/src/lib/shared/api";
import { FC, useCallback, useEffect, useId, useState } from "react";
import { Table } from "../../ui/Table";
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

const ALL_ROLES: IRole[] = ["user", "admin", "moderator"];

const UserList: FC = () => {
  const tableId = useId();
  const [users, setUsers] = useState<IUser[]>([]);
  const currentUser = useAuthStore((state) => state.profile);

  useEffect(() => {
    adminUsersApi.getUsers().then((response) => {
      setUsers(response.data);
    });
  }, []);

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

      for (const role of addedRoles) {
        await adminUsersApi.addUserRole(userId, role);
      }
      for (const role of removedRoles) {
        await adminUsersApi.removeUserRole(userId, role);
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, roles: newRoles } : u))
      );
    },
    [currentUser?._id]
  );

  const handleDeleteUser = useCallback(
    async (userId: string, userName: string) => {
      const modalId = `delete-user-${userId}`;

      modal.open(
        <div className={styles.confirmModal}>
          <h3>Delete User</h3>
          <p>
            Are you sure you want to delete user <strong>{userName}</strong>?
          </p>
          <p className={styles.confirmModal__warning}>
            This will permanently delete the user and all related data (logs,
            ratings, playthroughs).
          </p>
          <div className={styles.confirmModal__buttons}>
            <Button
              color={ButtonColor.DEFAULT}
              onClick={() => modal.close(modalId)}
            >
              Cancel
            </Button>
            <Button
              color={ButtonColor.RED}
              onClick={async () => {
                await adminUsersApi.deleteUser(userId);
                setUsers((prev) => prev.filter((u) => u._id !== userId));
                modal.close(modalId);
              }}
            >
              Delete
            </Button>
          </div>
        </div>,
        { id: modalId }
      );
    },
    []
  );

  return (
    <div id={tableId}>
      <Table
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
