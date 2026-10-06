import {
  ChangeEventHandler,
  InputHTMLAttributes,
  ReactNode,
  Ref,
  useId,
} from "react";
import classNames from "classnames";
import type { FieldError } from "react-hook-form";
import { Input, InputProps } from "@/src/lib/shared/ui/Input";
import styles from "./fields.module.scss";

interface ITextFieldBaseProps extends Omit<
  InputProps,
  "value" | "onChange" | "name" | "error"
> {
  label: string;
  error?: string | FieldError;
  isLabelHidden?: boolean;
  isFlush?: boolean;
  action?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

interface ITextFieldValueProps extends ITextFieldBaseProps {
  name?: undefined;
  value?: string;
  onChange: (value: string) => void;
}

interface ITextFieldNativeProps extends ITextFieldBaseProps {
  name: string;
  value?: InputHTMLAttributes<HTMLInputElement>["value"];
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export type ITextFieldProps = ITextFieldValueProps | ITextFieldNativeProps;

export const TextField = (props: ITextFieldProps) => {
  const generatedId = useId();
  const {
    label,
    isLabelHidden,
    isFlush,
    action,
    id = generatedId,
    ...inputProps
  } = props;

  const handleChange: ChangeEventHandler<HTMLInputElement> | undefined =
    props.name === undefined
      ? (event) => props.onChange(event.target.value)
      : props.onChange;

  const input = (
    <Input
      aria-label={isLabelHidden ? label : undefined}
      {...inputProps}
      id={id}
      value={props.name === undefined ? (props.value ?? "") : props.value}
      onChange={handleChange}
    />
  );

  return (
    <div
      className={classNames(styles.field, { [styles.field_flush]: isFlush })}
    >
      {!isLabelHidden && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      {action ? (
        <div className={styles.field__row}>
          {input}
          {action}
        </div>
      ) : (
        input
      )}
    </div>
  );
};
