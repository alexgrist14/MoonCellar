"use client";

import { FC, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authAPI } from "@/src/lib/shared/api";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { getStatusSignInPath } from "@/src/lib/shared/utils/status-path.utils";
import styles from "./StatusGate.module.scss";

interface IStatusGateProps {
  state: "signedOut" | "expired";
}

export const StatusGate: FC<IStatusGateProps> = ({ state }) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const signIn = () => router.replace(getStatusSignInPath(pathname));

    if (state === "signedOut") {
      signIn();
      return;
    }

    authAPI
      .refreshToken()
      .then(() => router.refresh())
      .catch(signIn);
  }, [state, pathname, router]);

  return (
    <div className={styles.gate}>
      <Loader />
    </div>
  );
};
