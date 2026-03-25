import { userAPI } from "@/src/lib/shared/api";
import { useAuth } from "@/src/lib/shared/hooks/auth";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useSettingsStore } from "@/src/lib/shared/store/settings.store";
import AvatarSettings from "@/src/lib/shared/ui/AvatarSettings/AvatarSettings";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  ChangeEvent,
  FC,
  FormEvent,
  MouseEvent,
  useRef,
  useState,
} from "react";
import styles from "./Settings.module.scss";

interface SettingsProps {}

export const Settings: FC<SettingsProps> = ({}) => {
  const { isAuth, profile } = useAuthStore();
  const { bgOpacity, setBgOpacity } = useSettingsStore();

  const { logout } = useAuth();
  const [userName, setUserName] = useState("");
  const [tempAvatar, setTempAvatar] = useState<File>();
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState<File>();
  const [raUsername, setRaUserName] = useState("");
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isAuth && profile) {
      logout(profile._id);
    }
  };

  const handleBackgroundChange = (e: any) => {
    e.preventDefault();
    bgInputRef.current?.click();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    const apiCalls = [];
    if (description) {
      apiCalls.push(userAPI.updateDescription(profile._id, { description }));
    }
    if (tempAvatar) {
      apiCalls.push(userAPI.addAvatar(profile._id, tempAvatar));
    }
    if (raUsername)
      apiCalls.push(userAPI.setRaUserInfo(profile._id, raUsername));
    if (background)
      apiCalls.push(userAPI.addBackground(profile._id, background));

    Promise.all(apiCalls).then(() => {
      toast.success({ description: "Saved successfully" });
    });
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
            color={ButtonColor.RED}
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
          <label htmlFor="bg">Background</label>
          <br />
          <br />
          <input
            type="file"
            id="bg"
            ref={bgInputRef}
            hidden
            onChange={(e) => setBackground(e.target.files?.[0])}
          />
          {profile?.background && (
            <span className={styles.currentFile}>
              Current:{" "}
              {profile.background.split("cloud/")[1]?.split(/\.\w+\./)[0] +
                profile.background.match(/\.\w+(?=\.)/)?.[0]}
            </span>
          )}
          {background && (
            <>
              <br />
              <br />
              <span className={styles.currentFile}>New: {background.name}</span>
            </>
          )}
          <Button
            color={ButtonColor.ACCENT}
            className={styles.background}
            onClick={handleBackgroundChange}
          >
            Choose background
          </Button>
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
