import { useEffect } from "react";

export const useWindowScroll = (callback: () => void) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", callback);
    }

    callback();

    return () => window.removeEventListener("scroll", callback);
  }, [callback]);
};
