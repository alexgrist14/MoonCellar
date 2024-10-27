import { KeyboardEvent } from 'react';

const blurOnKey = (e: KeyboardEvent) => {
  if (['Enter', 'Escape'].includes(e.key)) {
    (document.activeElement as HTMLElement).blur();
  }
};

export const keyboardUtils = {
  blurOnKey,
};
