import { useEffect, useRef } from "react";
import { mediaMin } from "../utils/get-screen-width";
import { screenSize } from "../styles/constants";

export const useDisableScroll = (isActive: boolean, isMobile?: boolean) => {
  const scrollYWindow = useRef(0);
  useEffect(() => {
    scrollYWindow.current = window.scrollY;
    if (isMobile && mediaMin(screenSize.Sm)) return;
    if (isActive) {
      document.body.style.position = "fixed";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.top = `-${scrollYWindow.current}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      window.scroll({
        top: parseInt(scrollY || "0") * -1,
        behavior: "instant",
      });
    }
  }, [isActive]);
};
