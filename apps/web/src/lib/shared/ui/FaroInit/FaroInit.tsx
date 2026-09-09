"use client";

import { useEffect } from "react";
import { initFaro } from "../../utils/faro.utils";

export const FaroInit = () => {
  useEffect(() => {
    initFaro();
  }, []);

  return null;
};
