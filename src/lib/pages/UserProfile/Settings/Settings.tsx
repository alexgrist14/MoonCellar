import { useAuth } from "@/src/lib/shared/hooks/auth";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import AvatarSettings from "@/src/lib/shared/ui/AvatarSettings/AvatarSettings";
import { Button } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { FC, FormEvent, useState } from "react";
import styles from "./Settings.module.scss";
import { userAPI } from "@/src/lib/shared/api";
import { axiosUtils } from "@/src/lib/shared/utils/axios";
import { toast } from "@/src/lib/shared/utils/toast";

interface SettingsProps {}

export const Settings: FC<SettingsProps> = ({}) => {
  const { isAuth, profile } = useAuthStore();
  const { logout } = useAuth();
  const [userName, setUserName] = useState("");
  const [description, setDescription] = useState("");

  const handleLogoutClick = () => {
    if (isAuth && profile) {
      logout(profile._id);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (description && profile)
      userAPI
        .updateDescription(profile._id, { description })
        .then(() => toast.success({ description: "Saved successfully" }))
        .catch((err) => axiosUtils.toastError(err));
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
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
            onChange={(e) => setUserName(e.target.value)}
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

        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <Input
            id="description"
            defaultValue={profile?.description}
            className={styles.input}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button type="submit" className={styles.btn} color={"accent"}>
          Save
        </Button>
      </div>
    </form>
  );
};
