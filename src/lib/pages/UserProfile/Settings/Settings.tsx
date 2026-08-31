import { useUpdateProfileMutation } from "@/src/lib/entities/user/api/user.mutations";
import { useAuth } from "@/src/lib/shared/hooks/auth";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useGeoStore } from "@/src/lib/shared/store/geo.store";
import { useSettingsStore } from "@/src/lib/shared/store/settings.store";
import AvatarSettings from "@/src/lib/shared/ui/AvatarSettings/AvatarSettings";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, MouseEvent, useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import styles from "./Settings.module.scss";
import { settingsSchema, SettingsSchema } from "./settings.schema";

interface SettingsProps {}

export const Settings: FC<SettingsProps> = ({}) => {
  const { isAuth, profile } = useAuthStore();
  const { mutate: updateProfile, isPending } = useUpdateProfileMutation();
  const { bgOpacity, setBgOpacity } = useSettingsStore();
  const blockedCountry = useGeoStore((s) => s.blockedCountry);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    mode: "onBlur",
    defaultValues: {
      userName: profile?.userName,
      email: profile?.email,
      description: profile?.description,
      raUsername: profile?.raUsername,
      showAdultContent: !!profile?.settings?.showAdultContent,
    },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      userName: profile.userName,
      email: profile.email,
      description: profile.description,
      raUsername: profile.raUsername,
      showAdultContent: !!profile.settings?.showAdultContent,
    });
  }, [profile, reset]);

  const showAdultContent = watch("showAdultContent");

  const onSubmit: SubmitHandler<SettingsSchema> = (data) => {
    if (!profile) return;

    updateProfile(
      {
        userId: profile._id,
        ...(data.description !== profile.description && {
          description: data.description ?? "",
        }),
        ...(tempAvatar && { avatar: tempAvatar }),
        ...(data.raUsername &&
          data.raUsername !== profile.raUsername && {
            raUsername: data.raUsername,
          }),
        ...(background && { background }),
        ...(!blockedCountry &&
          data.showAdultContent !== !!profile.settings?.showAdultContent && {
            settings: { showAdultContent: !!data.showAdultContent },
          }),
      },
      {
        onSuccess: () => {
          toast.success({ description: "Saved successfully" });
          setTempAvatar(undefined);
          setBackground(undefined);
        },
      }
    );
  };

  const { logout } = useAuth();
  const [tempAvatar, setTempAvatar] = useState<File>();
  const [background, setBackground] = useState<File>();
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isAuth && profile) {
      logout(profile._id);
    }
  };

  const handleBackgroundChange = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    bgInputRef.current?.click();
  };

  const backgroundFileName = profile?.background
    ? profile.background.split("/").pop()
    : null;

  return (
    <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
      <h2 className={styles.pageTitle}>Profile Settings</h2>

      <section className={styles.section}>
        <SectionTitle as="h3">Account</SectionTitle>
        <div className={styles.identity}>
          <div className={styles.identity__avatar}>
            <AvatarSettings
              tempAvatar={tempAvatar}
              setTempAvatar={setTempAvatar}
            />
          </div>
          <div className={styles.identity__fields}>
            <div className={styles.field}>
              <label htmlFor="userName">User Name</label>
              <Input
                id="userName"
                className={styles.input}
                containerClassname={styles.input}
                {...register("userName")}
                error={errors.userName}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <Input
                type="email"
                id="email"
                className={styles.input}
                containerClassname={styles.input}
                {...register("email")}
                error={errors.email}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="ra">RA username</label>
              <Input
                type="text"
                id="ra"
                className={styles.input}
                containerClassname={styles.input}
                {...register("raUsername")}
                error={errors.raUsername}
              />
            </div>
          </div>
        </div>
        <div className={styles.field}>
          <label htmlFor="description">Description</label>
          <Textarea
            id="description"
            className={styles.input}
            classNameField={styles.input}
            error={errors.description}
            {...register("description")}
          />
        </div>
      </section>

      <section className={styles.section}>
        <SectionTitle as="h3">Appearance</SectionTitle>
        <div className={styles.field}>
          <label htmlFor="bg">Background</label>
          <input
            type="file"
            id="bg"
            ref={bgInputRef}
            hidden
            onChange={(e) => setBackground(e.target.files?.[0])}
          />
          <div className={styles.backgroundMeta}>
            {backgroundFileName && (
              <span className={styles.fileName}>
                Current: {backgroundFileName}
              </span>
            )}
            {background && (
              <span className={styles.fileName}>New: {background.name}</span>
            )}
          </div>
          <Button
            color={ButtonColor.ACCENT}
            className={styles.backgroundBtn}
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
      </section>

      <section className={styles.section}>
        <SectionTitle as="h3">Preferences</SectionTitle>
        <div className={styles.prefRow}>
          <div className={styles.prefRow__text}>
            <label>Show 18+ content</label>
          </div>
          <ToggleSwitch
            value={blockedCountry || showAdultContent ? "right" : "left"}
            isDisabled={blockedCountry}
            clickCallback={(result) =>
              setValue("showAdultContent", result === "ON", {
                shouldDirty: true,
              })
            }
          />
        </div>
      </section>

      <div className={styles.actions}>
        <Button
          className={styles.btn}
          color={ButtonColor.RED}
          onClick={handleLogout}
        >
          Logout
        </Button>
        <Button
          type="submit"
          className={styles.btn}
          color={ButtonColor.ACCENT}
          disabled={isPending}
        >
          Save
        </Button>
      </div>
    </form>
  );
};
