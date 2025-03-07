import { authAPI, userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { FC, ReactNode, useEffect } from "react";
import styles from "./Layout.module.scss";
import { Header } from "./components";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { useResizeDetector } from "react-resize-detector";
import { mediaMax } from "@/src/lib/shared/utils/get-screen-width";
import { useDebouncedCallback } from "use-debounce";

interface ILayoutProps {
  children: ReactNode;
  className?: string;
}

export const Layout: FC<ILayoutProps> = ({ children, className }) => {
  const { getById } = userAPI;
  const { refreshToken } = authAPI;
  const { setAuth, setProfile, clear, isAuth } = useAuthStore();
  const { setMobile } = useStatesStore();

  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  useEffect(() => {
    refreshToken()
      .then((res) => {
        setAuth(true);
        getById(res.data.userId).then((res) => {
          setProfile(res.data);
        });
      })
      .catch(() => {
        clear();
      });
  }, [clear, getById, isAuth, refreshToken, setAuth, setProfile]);

  const debouncedSetMobile = useDebouncedCallback(() => {
    setMobile(mediaMax(768));
  }, 300);

  useEffect(() => {
    setMobile(mediaMax(768));

    window.addEventListener("resize", debouncedSetMobile);

    return () => window.removeEventListener("resize", debouncedSetMobile);
  }, []);

  return (
    <div className={className}>
      <Header />
      <Scrollbar stl={styles} type="absolute" fadeType="bottom">
        <main className={"container"} ref={ref}>
          {children}
        </main>
      </Scrollbar>
    </div>
  );
};
