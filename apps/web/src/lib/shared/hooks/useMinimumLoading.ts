import { useEffect, useRef, useState } from "react";

export const MIN_LOADER_DURATION = 200;

export const useMinimumLoading = (
  isLoading: boolean,
  minDuration = MIN_LOADER_DURATION
) => {
  const [isHeld, setIsHeld] = useState(isLoading);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      startedAt.current = Date.now();
      setIsHeld(true);
      return;
    }

    const remaining =
      startedAt.current === null
        ? 0
        : minDuration - (Date.now() - startedAt.current);

    if (remaining <= 0) {
      startedAt.current = null;
      setIsHeld(false);
      return;
    }

    const timeout = setTimeout(() => {
      startedAt.current = null;
      setIsHeld(false);
    }, remaining);

    return () => clearTimeout(timeout);
  }, [isLoading, minDuration]);

  return isLoading || isHeld;
};
