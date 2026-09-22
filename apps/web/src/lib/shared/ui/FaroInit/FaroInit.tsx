"use client";

import { useEffect } from "react";
import { initFaro } from "@/src/lib/shared/utils/faro.utils";

export const FaroInit = () => {
  useEffect(() => {
    initFaro();
  }, []);

  return null;
};
