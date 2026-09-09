import { RefObject, useEffect } from "react";

export const useAutoResizeTextArea = ({
  isDisabled,
  isActive = true,
  textAreaRef,
  value,
  replicaRef,
}: {
  isDisabled?: boolean;
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  replicaRef?: RefObject<HTMLDivElement | null>;
  value: string;
  isActive?: boolean;
}) => {
  useEffect(() => {
    if (!textAreaRef.current || isDisabled) return;

    const { style, scrollHeight } = textAreaRef.current;

    if (!!replicaRef?.current) {
      style.height =
        replicaRef.current.getBoundingClientRect().height.toString() + "px";
      return;
    }

    if (isActive) {
      style.height = "auto";
      style.height = scrollHeight + "px";
    }
  }, [textAreaRef, value, isActive, replicaRef, isDisabled]);
};
