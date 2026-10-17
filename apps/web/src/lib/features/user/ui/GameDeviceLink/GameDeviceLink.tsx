"use client";

import { FC, FormEvent, useState } from "react";
import {
  useApproveGameDeviceMutation,
  useGameDeviceLinkQuery,
} from "@/src/lib/entities/game-session/api";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import styles from "./GameDeviceLink.module.scss";

const CODE_LENGTH = 8;

const normalizeCode = (value: string) => {
  const plain = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH);
  return plain.length > 4 ? `${plain.slice(0, 4)}-${plain.slice(4)}` : plain;
};

const isComplete = (code: string) =>
  code.replace("-", "").length === CODE_LENGTH;

interface IGameDeviceLinkProps {
  initialCode?: string;
}

export const GameDeviceLink: FC<IGameDeviceLinkProps> = ({ initialCode }) => {
  const [input, setInput] = useState(() => normalizeCode(initialCode ?? ""));
  const [code, setCode] = useState<string | null>(() => {
    const initial = normalizeCode(initialCode ?? "");
    return isComplete(initial) ? initial : null;
  });

  const link = useGameDeviceLinkQuery(code);
  const approve = useApproveGameDeviceMutation();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (isComplete(input)) setCode(input);
  };

  if (link.data?.approved) {
    return (
      <div className={styles.link}>
        <p className={styles.link__done}>
          {link.data.deviceName} is signed in. You can go back to the game.
        </p>
        <span className={styles.link__note}>
          To sign it out later, open Settings → Game devices.
        </span>
      </div>
    );
  }

  return (
    <form className={styles.link} onSubmit={handleSubmit}>
      <div className={styles.link__field}>
        <label htmlFor="game-link-code">Code from the game</label>
        <Input
          id="game-link-code"
          value={input}
          onChange={(event) => {
            setInput(normalizeCode(event.target.value));
            setCode(null);
          }}
          placeholder="ABCD-EFGH"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={styles.link__code}
          error={link.isError ? "Unknown or expired code" : undefined}
        />
      </div>
      {link.data ? (
        <div className={styles.link__confirm}>
          <span className={styles.link__note}>
            <b>{link.data.deviceName}</b> asks to sign in with your account.
            Confirm only if you started this on your own device.
          </span>
          <Button
            type="button"
            color={ButtonColor.ACCENT}
            className={styles.link__button}
            isLoading={approve.isPending}
            onClick={() => approve.mutate(link.data.userCode)}
          >
            Sign in this device
          </Button>
        </div>
      ) : (
        <Button
          type="submit"
          className={styles.link__button}
          disabled={!isComplete(input)}
          isLoading={link.isFetching}
        >
          Continue
        </Button>
      )}
    </form>
  );
};
