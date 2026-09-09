import { EventEmitter } from "events";
import { ComponentProps } from "react";
import { Toast } from "../ui/Toast/Toast";

export const evToast = new EventEmitter();

type IToastProps = Omit<ComponentProps<typeof Toast>, "type">;

export const toast = {
  error: (props: IToastProps) => {
    evToast.emit("open", { props: { ...props, type: "error" } });
  },
  success: (props: IToastProps) => {
    evToast.emit("open", { props: { ...props, type: "success" } });
  },
};
