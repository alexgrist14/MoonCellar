import { useEffect, useRef } from "react";

export const useEffectOnce = (
  callback: () => Promise<unknown>,
  isReady: boolean
) => {
  const isParsed = useRef(false);
  const isStarted = useRef(false);

  return useEffect(() => {
    if (!isReady || isParsed.current || isStarted.current) return;

    isStarted.current = true;

    callback().then(() => {
      isParsed.current = true;
      isStarted.current = false;
    });
  }, [callback, isReady]);
};
