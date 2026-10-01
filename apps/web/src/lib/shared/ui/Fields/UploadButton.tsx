import { FC, MouseEvent, useRef, useState } from "react";
import cn from "classnames";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import styles from "./fields.module.scss";

interface IUploadButtonProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  tooltip?: string;
  label?: string;
  fileName?: string | null;
  className?: string;
  isFullWidth?: boolean;
  isFullWidthOnMobile?: boolean;
}

export const UploadButton: FC<IUploadButtonProps> = ({
  onFile,
  disabled,
  tooltip,
  label = "Choose file",
  fileName,
  className,
  isFullWidth,
  isFullWidthOnMobile,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickedName, setPickedName] = useState<string>();
  const shownName = fileName === undefined ? pickedName : fileName;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div
      className={cn(styles.uploadRow, className, {
        [styles.uploadRow_fullWidth]: isFullWidth,
        [styles.uploadRow_fullWidthMobile]: isFullWidthOnMobile,
      })}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setPickedName(file.name);
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
      {!!shownName && <span className={styles.fileName}>{shownName}</span>}
    </div>
  );
};
