import { useEffect } from "react";
import { PAGE_SCROLL_ID } from "../utils/common.utils";

let lockCount = 0;

export const useDisableScroll = (isActive = true) => {
  useEffect(() => {
    if (!isActive) return;

    const container = document.getElementById(PAGE_SCROLL_ID);

    if (!container) return;

    lockCount++;
    container.style.overflow = "hidden";

    return () => {
      lockCount--;

      if (!lockCount) container.style.removeProperty("overflow");
    };
  }, [isActive]);
};
