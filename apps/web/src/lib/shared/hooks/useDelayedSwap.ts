import { AnimationEvent, useCallback, useEffect, useState } from "react";

export const useDelayedSwap = <T>(value: T) => {
  const [rendered, setRendered] = useState(value);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    setIsExiting(value !== rendered);
  }, [value, rendered]);

  const onExitEnd = useCallback(
    (event: AnimationEvent<HTMLElement>) => {
      if (!isExiting || event.target !== event.currentTarget) return;

      setRendered(value);
      setIsExiting(false);
    },
    [isExiting, value]
  );

  return { rendered, isExiting, onExitEnd };
};
