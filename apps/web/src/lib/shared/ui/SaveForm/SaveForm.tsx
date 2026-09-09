import { FC, useState } from "react";
import styles from "./SaveForm.module.scss";
import { Box } from "../Box";
import { Input } from "../Input";
import { Button, ButtonColor } from "../Button";

export const SaveForm: FC<{
  placeholder?: string;
  saveCallback: (name: string) => void;
}> = ({ placeholder, saveCallback }) => {
  const [name, setName] = useState("");

  return (
    <Box classNameContent={styles.form}>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && saveCallback(name)}
        placeholder={placeholder || "Enter name..."}
      />
      <Button
        color={ButtonColor.ACCENT}
        disabled={!name}
        onClick={() => saveCallback(name)}
      >
        Save
      </Button>
    </Box>
  );
};
