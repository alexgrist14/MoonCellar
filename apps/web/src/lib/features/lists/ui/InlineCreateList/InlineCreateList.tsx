import { FC, KeyboardEvent, useState } from "react";
import { isAxiosError } from "axios";
import {
  CUSTOM_LIST_NAME_MAX,
  CUSTOM_LIST_NAME_MIN,
} from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { SvgPlus } from "@/src/lib/shared/ui/svg";
import styles from "./InlineCreateList.module.scss";

interface IInlineCreateListProps {
  isOpen: boolean;
  onOpen: () => void;
  onCreate: (name: string) => Promise<unknown>;
  onCancel?: () => void;
  isCreating?: boolean;
  hint?: string;
  openLabel?: string;
}

const getErrorMessage = (error: unknown) => {
  const message = isAxiosError(error)
    ? error.response?.data?.message
    : undefined;

  return typeof message === "string"
    ? message
    : "The list could not be created";
};

const validateName = (name: string) => {
  if (name.length < CUSTOM_LIST_NAME_MIN) {
    return `Name must be at least ${CUSTOM_LIST_NAME_MIN} characters`;
  }

  if (name.length > CUSTOM_LIST_NAME_MAX) {
    return `Name must be at most ${CUSTOM_LIST_NAME_MAX} characters`;
  }
};

export const InlineCreateList: FC<IInlineCreateListProps> = ({
  isOpen,
  onOpen,
  onCreate,
  onCancel,
  isCreating,
  hint,
  openLabel = "New list",
}) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  const reset = () => {
    setName("");
    setError(undefined);
  };

  const submit = async () => {
    const trimmed = name.trim();
    const validationError = validateName(trimmed);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await onCreate(trimmed);
      reset();
    } catch (createError) {
      setError(getErrorMessage(createError));
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }

    if (event.key === "Escape" && onCancel) {
      event.stopPropagation();
      reset();
      onCancel();
    }
  };

  if (!isOpen) {
    return (
      <div className={styles.create}>
        <Button
          type="button"
          color={ButtonColor.GHOST}
          className={styles.create__open}
          onClick={onOpen}
        >
          <SvgPlus size="16" style={{ color: "inherit" }} />
          {openLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.create}>
      <div className={styles.create__row}>
        <Input
          autoFocus
          value={name}
          placeholder="New list name"
          disabled={isCreating}
          error={error}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          color={ButtonColor.ACCENT}
          disabled={isCreating || !name.trim()}
          onClick={submit}
        >
          Create
        </Button>
      </div>
      {!error && !!hint && <span className={styles.create__hint}>{hint}</span>}
    </div>
  );
};
