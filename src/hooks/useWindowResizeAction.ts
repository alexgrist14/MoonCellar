import { useCallback, useEffect, useMemo } from 'react';

export const useWindowResizeAction = (callback: () => void, deps?: any[]) => {
  const incomingDeps = useMemo(() => deps || [], [deps]);

  const cb = useCallback(() => callback(), [callback]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', cb);
    }

    callback();

    return () => window.removeEventListener('resize', cb);

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [...incomingDeps]);
};
