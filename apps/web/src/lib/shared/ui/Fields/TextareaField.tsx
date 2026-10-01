import { ChangeEventHandler, useId } from "react";
import type { FieldError } from "react-hook-form";
import { ITextareaProps, Textarea } from "@/src/lib/shared/ui/Textarea";
import styles from "./fields.module.scss";

interface ITextareaFieldBaseProps extends Omit<
  ITextareaProps,
  "value" | "onChange" | "name" | "error"
> {
  label: string;
  error?: string | FieldError;
}

interface ITextareaFieldValueProps extends ITextareaFieldBaseProps {
  name?: undefined;
  value?: string;
  onChange: (value: string) => void;
}

interface ITextareaFieldNativeProps extends ITextareaFieldBaseProps {
  name: string;
  value?: ITextareaProps["value"];
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
}

export type ITextareaFieldProps =
  ITextareaFieldValueProps | ITextareaFieldNativeProps;

export const TextareaField = (props: ITextareaFieldProps) => {
  const generatedId = useId();
  const { label, error, id = generatedId, ...textareaProps } = props;

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> | undefined =
    props.name === undefined
      ? (event) => props.onChange(event.target.value)
      : props.onChange;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <Textarea
        {...textareaProps}
        id={id}
        value={props.name === undefined ? (props.value ?? "") : props.value}
        onChange={handleChange}
        error={
          typeof error === "string" ? { type: "manual", message: error } : error
        }
      />
    </div>
  );
};
