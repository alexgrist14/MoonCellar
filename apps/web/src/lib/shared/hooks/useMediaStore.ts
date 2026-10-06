import { useThrottledCallback } from "use-debounce";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useEffect } from "react";

export const useMediaStore = () => {
  const { setMobile, isMobile, setSmall, isSmall } = useStatesStore();

  const debouncedSetMobile = useThrottledCallback(() => {
    const state = window.innerWidth <= 768;
    state !== isMobile && setMobile(state);
    const small = window.innerWidth <= 500;
    small !== isSmall && setSmall(small);
  }, 300);

  return useEffect(() => {
    debouncedSetMobile();

    window.addEventListener("resize", debouncedSetMobile);

    return () => window.removeEventListener("resize", debouncedSetMobile);
  }, [debouncedSetMobile]);
};
