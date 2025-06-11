import { DetailedHTMLProps, TextareaHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

type ITextareaType = Pick<
  DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
  >,
  | "onFocus"
  | "defaultValue"
  | "autoComplete"
  | "disabled"
  | "id"
  | "value"
  | "onChange"
  | "onBlur"
  | "name"
  | "rows"
  | "onClick"
  | "readOnly"
  | "placeholder"
  | "className"
  | "children"
  | "style"
  | "onKeyDown"
  | "ref"
>;

export interface ITextareaProps extends ITextareaType {
  error?: FieldError;
  clearErrors?: any;
  resize?: boolean;
  classNameField?: string;
}
