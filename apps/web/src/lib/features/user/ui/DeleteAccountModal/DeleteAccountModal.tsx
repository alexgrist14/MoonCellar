import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteAccountMutation } from "@/src/lib/entities/user/api/user.mutations";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { modal } from "@/src/lib/shared/ui/Modal";
import {
  getPushSubscription,
  setTabNotifications,
} from "@/src/lib/shared/utils/push.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./DeleteAccountModal.module.scss";

export const DELETE_ACCOUNT_MODAL_ID = "delete-account";

const REMOVED_DATA = [
  "your profile, avatar and background",
  "ratings, playthroughs and reviews",
  "custom lists and their likes",
  "activity, followings and notifications",
];

export const DeleteAccountModal: FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const setPlaythroughs = useUserStore((s) => s.setPlaythroughs);
  const [password, setPassword] = useState("");
  const { mutate: deleteAccount, isPending } = useDeleteAccountMutation();
  const { push } = useRouter();

  const close = () => modal.close(DELETE_ACCOUNT_MODAL_ID);

  const submit = () =>
    !!profile &&
    !!password &&
    deleteAccount(
      { userId: profile._id, password },
      {
        onSuccess: () => {
          setTabNotifications(false);
          void getPushSubscription()
            .then((subscription) => subscription?.unsubscribe())
            .catch(() => undefined);
          setPlaythroughs(undefined);
          close();
          push("/");
          toast.success({ description: "Your account was deleted" });
        },
      }
    );

  return (
    <Box
      title="Delete account"
      isTitleStart
      onClose={close}
      classNameContent={styles.content}
    >
      <p>This removes for good:</p>
      <ul className={styles.list}>
        {REMOVED_DATA.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={styles.warning}>
        Your comments stay in their threads as deleted. This cannot be undone.
      </p>
      <label htmlFor="delete-account-password" className={styles.label}>
        Enter your password to confirm
      </label>
      <Input
        id="delete-account-password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <div className={styles.buttons}>
        <Button
          type="button"
          color={ButtonColor.DEFAULT}
          disabled={isPending}
          onClick={close}
        >
          Cancel
        </Button>
        <Button
          type="button"
          color={ButtonColor.RED}
          disabled={!password || isPending}
          onClick={submit}
        >
          Delete account
        </Button>
      </div>
    </Box>
  );
};
