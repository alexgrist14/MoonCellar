import { AnimationEvent, useCallback, useEffect, useState } from "react";

export const useDelayedUnmount = <T>(value: T | undefined) => {
  const [rendered, setRendered] = useState(value);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (value !== undefined) {
      setRendered(value);
      setIsExiting(false);
      return;
    }

    if (rendered !== undefined) setIsExiting(true);
  }, [value, rendered]);

  const onExitEnd = useCallback(
    (event: AnimationEvent<HTMLElement>) => {
      if (!isExiting || event.target !== event.currentTarget) return;

      setRendered(undefined);
      setIsExiting(false);
    },
    [isExiting]
  );

  return { rendered, isExiting, onExitEnd };
};
