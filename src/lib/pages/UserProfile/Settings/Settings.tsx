import { useAuth } from "@/src/lib/shared/hooks/auth";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import AvatarSettings from "@/src/lib/shared/ui/AvatarSettings/AvatarSettings";
import { Button } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { FC } from "react";
import styles from "./Settings.module.scss";

interface SettingsProps {}

export const Settings: FC<SettingsProps> = ({}) => {
  const { isAuth, profile } = useAuthStore();
  const { logout } = useAuth();

  const handleLogoutClick = () => {
    if (isAuth && profile) {
      logout(profile._id);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Profile Settings</h2>
      <div className={styles.content}>
        <div className={styles.content__top}>
          <AvatarSettings />
          <Button
            className={styles.btn}
            color={"red"}
            onClick={handleLogoutClick}
          >
            Logout
          </Button>
        </div>

        <div className={styles.field}>
          <label htmlFor="userName">User Name</label>
          <Input
            id="userName"
            defaultValue={profile?.userName}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <Input
            type="email"
            id="email"
            defaultValue={profile?.email}
            className={styles.input}
          />
        </div>
        <Button className={styles.btn} color={"accent"}>
          Save
        </Button>
      </div>
    </div>
  );
};
