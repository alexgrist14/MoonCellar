import { userAPI } from "@/src/lib/shared/api";
import { useAuth } from "@/src/lib/shared/hooks/auth";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import AvatarSettings from "@/src/lib/shared/ui/AvatarSettings/AvatarSettings";
import { Button } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import { axiosUtils } from "@/src/lib/shared/utils/axios";
import { toast } from "@/src/lib/shared/utils/toast";
import {
  Dispatch,
  FC,
  FormEvent,
  SetStateAction,
  useState,
  MouseEvent,
} from "react";
import styles from "./Settings.module.scss";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { useSettingsStore } from "@/src/lib/shared/store/settings.store";

interface SettingsProps {}

export const Settings: FC<SettingsProps> = ({}) => {
  const { isAuth, profile } = useAuthStore();
  const { bgOpacity, setBgOpacity } = useSettingsStore();

  const { logout } = useAuth();
  const [userName, setUserName] = useState("");
  const [tempAvatar, setTempAvatar] = useState<File>();
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState("");
  const [raUsername, setRaUserName] = useState("");

  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isAuth && profile) {
      logout(profile._id);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const apiCalls = [];
    if (description) {
      apiCalls.push(() =>
        userAPI.updateDescription(profile._id, { description })
      );
    }
    if (tempAvatar)
      apiCalls.push(() => userAPI.addAvatar(profile._id, tempAvatar));
    if (raUsername)
      apiCalls.push(() => userAPI.setRaUserInfo(profile._id, raUsername));
    if (background)
      apiCalls.push(() => userAPI.addBackground(profile._id, background));

    Promise.all(apiCalls.map((apiCall) => apiCall()))
      .then(() => {
        toast.success({ description: "Saved successfully" });
      })
      .catch((err) => axiosUtils.toastError(err));
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Profile Settings</h2>
      <div className={styles.content}>
        <div className={styles.content__top}>
          <AvatarSettings
            tempAvatar={tempAvatar}
            setTempAvatar={setTempAvatar}
          />
          <Button
            className={styles.btn}
            color={"red"}
            onClick={(e) => handleLogout(e)}
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
          <label htmlFor="ra">RA username</label>
          <Input
            type="text"
            id="ra"
            defaultValue={profile?.raUsername}
            className={styles.input}
            onChange={(e) => setRaUserName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="bg">Background URL</label>
          <Input
            type="text"
            id="bg"
            defaultValue={profile?.background}
            className={styles.input}
            onChange={(e) => setBackground(e.target.value)}
          />
        </div>

        <RangeSelector
          defaultValue={bgOpacity || 0}
          callback={(val) => setBgOpacity(val)}
          min={0}
          max={100}
          text={`Background opacity ${bgOpacity || 0}%`}
          step={1}
        />

        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <Textarea
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
