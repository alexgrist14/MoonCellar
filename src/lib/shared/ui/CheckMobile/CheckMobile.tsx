"use client";

import { FC, ReactNode } from "react";
import { useStatesStore } from "../../store/states.store";

export const CheckMobile: FC<{ children: ReactNode }> = ({ children }) => {
  const { isMobile } = useStatesStore();

  return isMobile !== undefined ? children : null;
};
