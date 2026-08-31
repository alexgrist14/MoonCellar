"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useNavigationStore } from "../store/navigation.store";

const NAVIGATION_TIMEOUT = 15000;

const isPlainLeftClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

export const useNavigationPending = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isNavigating = useNavigationStore((s) => s.isNavigating);
  const startNavigation = useNavigationStore((s) => s.startNavigation);
  const endNavigation = useNavigationStore((s) => s.endNavigation);

  useEffect(() => {
    let isCandidate = false;

    const handleClickCapture = (e: MouseEvent) => {
      isCandidate = false;

      if (!isPlainLeftClick(e)) return;

      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("button")) return;

      const anchor = target.closest("a");
      if (!anchor || !anchor.getAttribute("href")) return;
      if (anchor.hasAttribute("download")) return;
      if (!!anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      )
        return;

      isCandidate = true;
    };

    const handleClickBubble = () => {
      if (!isCandidate) return;

      isCandidate = false;
      startNavigation();
    };

    const handlePopState = () => startNavigation();

    document.addEventListener("click", handleClickCapture, true);
    window.addEventListener("click", handleClickBubble);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClickCapture, true);
      window.removeEventListener("click", handleClickBubble);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [startNavigation]);

  useEffect(() => {
    endNavigation();
  }, [pathname, searchParams, endNavigation]);

  useEffect(() => {
    if (!isNavigating) return;

    const timeout = setTimeout(endNavigation, NAVIGATION_TIMEOUT);

    return () => clearTimeout(timeout);
  }, [isNavigating, endNavigation]);

  return isNavigating;
};
