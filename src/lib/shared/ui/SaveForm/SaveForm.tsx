import { FC, useState } from "react";
import styles from "./SaveForm.module.scss";
import { WrapperTemplate } from "../WrapperTemplate";
import { Input } from "../Input";
import { Button } from "../Button";

export const SaveForm: FC<{
  placeholder?: string;
  saveCallback: (name: string) => void;
}> = ({ placeholder, saveCallback }) => {
  const [name, setName] = useState("");

  return (
    <WrapperTemplate classNameContent={styles.form}>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && saveCallback(name)}
        placeholder={placeholder || "Enter name..."}
      />
      <Button
        color="accent"
        disabled={!name}
        onClick={() => saveCallback(name)}
      >
        Save
      </Button>
    </WrapperTemplate>
  );
};
