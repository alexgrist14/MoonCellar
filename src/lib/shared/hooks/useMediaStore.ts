import { useThrottledCallback } from "use-debounce";
import { useStatesStore } from "../store/states.store";
import { useEffect } from "react";

export const useMediaStore = () => {
  const { setMobile, isMobile } = useStatesStore();

  const debouncedSetMobile = useThrottledCallback(() => {
    const state = window.innerWidth <= 768;
    state !== isMobile && setMobile(state);
  }, 300);

  return useEffect(() => {
    debouncedSetMobile();

    window.addEventListener("resize", debouncedSetMobile);

    return () => window.removeEventListener("resize", debouncedSetMobile);
  }, [debouncedSetMobile]);
};
