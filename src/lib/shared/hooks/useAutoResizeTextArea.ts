import { RefObject, useEffect } from "react";

export const useAutoResizeTextArea = ({
  isActive = true,
  textAreaRef,
  value,
  replicaRef,
}: {
  textAreaRef: RefObject<HTMLTextAreaElement | null>;
  replicaRef?: RefObject<HTMLDivElement | null>;
  value: string;
  isActive?: boolean;
}) => {
  useEffect(() => {
    if (!textAreaRef.current) return;

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
  }, [textAreaRef, value, isActive, replicaRef]);
};
