import { FC, MouseEvent, useRef, useState } from "react";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import styles from "./fields.module.scss";

interface IUploadButtonProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  tooltip?: string;
  label?: string;
}

export const UploadButton: FC<IUploadButtonProps> = ({
  onFile,
  disabled,
  tooltip,
  label = "Choose file",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div className={styles.uploadRow}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setFileName(file.name);
          onFile(file);
        }}
      />
      <Button
        type="button"
        color={ButtonColor.ACCENT}
        disabled={disabled}
        tooltip={tooltip}
        onClick={handleClick}
      >
        {label}
      </Button>
      {!!fileName && <span className={styles.fileName}>{fileName}</span>}
    </div>
  );
};
