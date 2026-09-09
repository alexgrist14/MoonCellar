import { useEffect, useRef } from "react";

export const useDisableScroll = () => {
  const scrollYWindow = useRef(0);
  useEffect(() => {
    scrollYWindow.current = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.top = `-${scrollYWindow.current}px`;

    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      window.scroll({
        top: parseInt(scrollY || "0") * -1,
        behavior: "instant",
      });
    };
  }, []);
};
