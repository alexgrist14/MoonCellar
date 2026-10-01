import { ComponentProps } from "react";
import { Toast } from "@/src/lib/shared/ui/Toast/Toast";

export type IToast = ComponentProps<typeof Toast> & {
  id: number;
  count: number;
  originalTitle?: string;
};
