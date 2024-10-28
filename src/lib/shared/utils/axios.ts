import { IAxiosErrorResponse } from "../types/common.type";
import { toast } from "./toast";

const toastError = (e: IAxiosErrorResponse) => {
  const msg = e.response?.data.message || "";
  const description = Array.isArray(msg) ? msg.join(", ") : msg;

  console.error(e);
  return toast.error({ title: "Error", description });
};

export const axiosUtils = {
  toastError,
};
