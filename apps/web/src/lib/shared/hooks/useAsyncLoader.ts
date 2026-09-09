import { useCallback, useState } from "react";

export const useAsyncLoader = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);

  const sync = useCallback(
    async (
      tryCallback: () => Promise<any>,
      cathCallback?: (error: unknown) => void
    ) => {
      try {
        setIsLoading(true);
        await tryCallback();
      } catch (error) {
        if (cathCallback) cathCallback(error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { isLoading, setIsLoading, sync };
};
