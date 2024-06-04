import { RefObject, useEffect } from 'react';

export const useAutoResizeTextArea = (
  textAreaRef: RefObject<HTMLTextAreaElement>,
  value: string,
) => {
  useEffect(() => {
    if (textAreaRef.current) {
      const { style, scrollHeight } = textAreaRef.current;

      style.height = scrollHeight + 'px';
    }
  }, [textAreaRef, value]);
};
