import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactDOM from "react-dom";
import cn from "classnames";
import styles from "./Toast.module.scss";
import { TOAST_SETTINGS } from "./toast.const";
import classNames from "classnames";
import { IToast } from "../../types/toast.type";

type IToastType = "success" | "error";

interface IToastProps {
  title?: string;
  description?: string;
  type?: IToastType;
  content?: ReactNode;
  className?: string;
  setToasters?: Dispatch<SetStateAction<IToast[]>>;
  toasters?: IToast[];
  toasterId?: number;
}

export const Toast: FC<IToastProps> = ({
  className,
  toasters,
  setToasters,
  toasterId,
  ...props
}) => {
  const [portal, setPortal] = useState<Element>();
  const [progress, setProgress] = useState(0);

  const isStopped = useRef(false);
  const timeLeft = useRef(0);

  const getStep = useCallback((data: number, start?: number) => {
    const left = data - (!!start ? start : data - timeLeft.current);

    if (isStopped.current) return (timeLeft.current = left);

    const time = TOAST_SETTINGS.DISPLAY_TIME - left;
    const beginAt = 100 - (time * 100) / TOAST_SETTINGS.DISPLAY_TIME + 2;
    const step = 100 / TOAST_SETTINGS.DISPLAY_TIME;

    setProgress(beginAt + step);

    if (time > 0) {
      requestAnimationFrame((data) =>
        getStep(data, !!start ? start : data - timeLeft.current)
      );
    }
  }, []);

  const onMouseEnter = () => {
    isStopped.current = true;
  };

  const onMouseLeave = () => {
    isStopped.current = false;

    requestAnimationFrame((data) => getStep(data));
  };

  const type = props?.type || "success";

  useEffect(() => {
    const _portal = document.getElementById("toast");

    if (_portal) {
      setPortal(_portal);
    }

    requestAnimationFrame((data) => getStep(data));
  }, [getStep]);

  useEffect(() => {
    if (progress >= 100) {
      !!setToasters &&
        setToasters((prev) => {
          const copy = [...prev];
          const currentToast = copy.find((item) => item.id === toasterId);

          if (currentToast?.timeout) {
            clearTimeout(currentToast?.timeout);
          }

          const filteredCopy = copy.filter((item) => item.id !== toasterId);
          return filteredCopy;
        });
    }
  }, [progress, setToasters, toasterId]);

  if (!portal) return;

  return ReactDOM.createPortal(
    <div
      className={cn(styles.toast, styles[`toast_${type}`], className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.toast__inner}>
        {props?.content || (
          <>
            <div className={styles.toast__content}>
              <div className={styles.toast__text}>
                {props?.title && (
                  <h4
                    className={classNames(styles.toast__title, {
                      [styles.toast__title_error]: type === "error",
                    })}
                  >
                    {props?.title}
                  </h4>
                )}
                {props?.description && <p>{props?.description}</p>}
              </div>
            </div>
          </>
        )}
        <div
          className={styles.toast__progress}
          style={{ maxWidth: `${progress}%` }}
        />
      </div>
    </div>,
    portal
  );
};
