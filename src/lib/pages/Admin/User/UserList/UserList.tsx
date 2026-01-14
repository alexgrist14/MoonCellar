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

const ALL_ROLES: IRole[] = ["user", "admin", "moderator"];

const UserList: FC = () => {
  const tableId = useId();
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    adminUsersApi.getUsers().then((response) => {
      setUsers(response.data);
    });
  }, []);

  const handleRolesChange = useCallback(
    async (userId: string, currentRoles: IRole[], newIndexes: number[]) => {
      const newRoles = newIndexes.map((i) => ALL_ROLES[i]);
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
        }))}
      />
    </div>
  );
};

export default UserList;
