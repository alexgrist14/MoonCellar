import { RefObject, useEffect } from "react";

const useCloseEvents = (
  refs: RefObject<HTMLElement>[],
  callback: () => void
): void => {
  useEffect(() => {
    const clickHandler = (e: MouseEvent): void => {
      refs.reduce(
        (result, ref) =>
          ref.current?.contains(e.target as Node) ? (result = false) : result,
        true
      ) && callback();
    };

    const keydownHandler = (e: KeyboardEvent): void => {
      e.key === "Escape" && callback();
    };

    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("keydown", keydownHandler);

    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("keydown", keydownHandler);
    };
  }, [refs, callback]);
};

export default useCloseEvents;
