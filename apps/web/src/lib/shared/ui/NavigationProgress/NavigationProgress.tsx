"use client";

import classNames from "classnames";
import { useEffect, useState } from "react";
import { useNavigationPending } from "../../hooks";
import styles from "./NavigationProgress.module.scss";

const RESET_DELAY = 500;

type Phase = "idle" | "start" | "loading" | "done";

export const NavigationProgress = () => {
  const isNavigating = useNavigationPending();
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (isNavigating) {
      setPhase("start");
      return;
    }

    setPhase((current) => (current === "idle" ? "idle" : "done"));
  }, [isNavigating]);

  useEffect(() => {
    if (phase !== "start") return;

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setPhase("loading"));
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;

    const timeout = setTimeout(() => setPhase("idle"), RESET_DELAY);

    return () => clearTimeout(timeout);
  }, [phase]);

  return (
    <div
      className={classNames(styles.progress, {
        [styles.progress_start]: phase === "start",
        [styles.progress_loading]: phase === "loading",
        [styles.progress_done]: phase === "done",
      })}
    />
  );
};
