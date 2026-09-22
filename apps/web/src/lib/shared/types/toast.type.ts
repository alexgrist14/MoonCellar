import { ComponentProps } from "react";
import { Toast } from "@/src/lib/shared/ui/Toast/Toast";

export type IToast = ComponentProps<typeof Toast> & {
  // id будет равен дате создания тостера
  id: number;
  timeout: NodeJS.Timeout;
  timeExpectation: number;
  timeStampMouseEnter?: number;
  count: number;
  originalTitle?: string;
};
