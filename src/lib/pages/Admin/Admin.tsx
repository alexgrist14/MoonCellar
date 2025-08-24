"use client";
import Image from "next/image";
import React, { useEffect } from "react";
import { adminUsersApi } from "../../shared/api";
import { IUser } from "../../shared/types/auth.type";
import { SvgProfile } from "../../shared/ui/svg";
import styles from "./Admin.module.scss";
import { Table } from "./ui/Table";

const Admin = () => {
  const [users, setUsers] = React.useState<IUser[]>([]);
  useEffect(() => {
    adminUsersApi.getUsers().then((response) => {
      setUsers(response.data);
    });
  }, []);
  return (
    <div>
      <Table
        headers={{
          userName: { content: "User" },
          raUsername: { content: "RA Username" },
          roles: { content: "Roles" },
          created: { content: "Created" },
        }}
        rows={users?.map((user) => ({
          userName: {
            content: (
              <div className={styles.container}>
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
              </div>
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

export default Admin;
