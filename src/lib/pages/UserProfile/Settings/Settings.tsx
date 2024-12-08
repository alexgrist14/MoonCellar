import { Dispatch, FC, SetStateAction, MouseEvent } from "react";
import styles from "./Settings.module.scss";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Input } from "@/src/lib/shared/ui/Input";
import { Button } from "@/src/lib/shared/ui/Button";
import ProfileAvatar from "@/src/lib/shared/ui/AvatarSettings/AvatarSettings";
import { useAuth } from "@/src/lib/shared/hooks/auth";

interface SettingsProps {
  avatar?: string;
  setAvatar: Dispatch<SetStateAction<string | undefined>>;
}

export const Settings: FC<SettingsProps> = ({ avatar, setAvatar }) => {
  const { isAuth, profile } = useAuthStore();
  const {logout} = useAuth();


  const handleLogoutClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isAuth && profile) {
      logout(profile._id);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Profile Settings</h2>
      <div className={styles.content}>
        <div className={styles.content__top}>
        <ProfileAvatar avatar={avatar} setAvatar={setAvatar} />
        <Button className={styles.btn} color={'red'} onClick={handleLogoutClick}>Logout</Button>
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
