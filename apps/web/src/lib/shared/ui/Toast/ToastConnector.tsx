import { useEffect, useState } from "react";
import { Toast } from "./Toast";
import styles from "./Toast.module.scss";
import { IToast } from "@/src/lib/shared/types/toast.type";
import { evToast } from "@/src/lib/shared/utils/toast.utils";

let nextToastId = 0;

export const ToastConnector = () => {
  const [toasters, setToasters] = useState<IToast[]>([]);

  const onClickToast = (id: number) =>
    setToasters((prev) => prev.filter((item) => item.id !== id));

  useEffect(() => {
    const onOpen = ({ props }: { props: IToast }) => {
      setToasters((prev) => {
        let _prev = [...prev];
        const toasterData: IToast = {
          ...props,
          id: ++nextToastId,
          count: 1,
        };

        if (props.title) {
          toasterData.originalTitle = props.title;
          const existsToaster = prev.findLast(
            (item) => item.originalTitle === toasterData.originalTitle
          );

          if (existsToaster) {
            _prev = _prev.filter(
              (item) => item.originalTitle !== toasterData.originalTitle
            );

            if (existsToaster.count > 1) {
              toasterData.title = `${toasterData.originalTitle} ${
                existsToaster.count + 1
              }x`;

              toasterData.count = existsToaster.count + 1;
            } else {
              toasterData.title = `${toasterData.originalTitle} 2x`;
              toasterData.count = 2;
            }
          }
        }

        _prev.push(toasterData);

        return _prev;
      });
    };

    evToast.on("open", onOpen);

    return () => {
      evToast.off("open", onOpen);
      setToasters([]);
    };
  }, []);

  return (
    <div
      id="toast"
      className={styles.connector}
      role="status"
      aria-live="polite"
    >
      {toasters.map((item) => (
        <div
          key={item.id}
          className={styles.toast__wrapper}
          onClick={() => onClickToast(item.id)}
        >
          <Toast
            toasterId={item.id}
            toasters={toasters}
            setToasters={setToasters}
            {...item}
          />
        </div>
      ))}
    </div>
  );
};
