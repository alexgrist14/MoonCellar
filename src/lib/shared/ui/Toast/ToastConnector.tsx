import { useEffect, useState } from "react";
import { Toast } from "./Toast";
import styles from "./Toast.module.scss";
import { IToast } from "../../types/toast.type";
import { evToast } from "../../utils/toast";

export const ToastConnector = () => {
  const [toasters, setToasters] = useState<IToast[]>([]);

  const onOpen = ({ props }: { props: IToast }) => {
    setToasters((prev) => {
      let _prev = [...prev];
      const id = Date.now();

      const toasterData = {
        ...props,
        id,
        timeExpectation: 0,
        count: 1,
      };

      if (props.title) {
        toasterData.originalTitle = props.title;

        // already exists toaster with same title (originalTitle)
        const existsToaster = prev.findLast(
          (item) => item.originalTitle === toasterData.originalTitle,
        );

        if (existsToaster) {
          _prev = _prev.filter(
            (item) => item.originalTitle !== toasterData.originalTitle,
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

  const onClickToast = (id: number) =>
    setToasters((prev) => {
      const copy = [...prev];
      const currentToast = copy.find((item) => item.id === id);

      if (currentToast?.timeout) {
        clearTimeout(currentToast?.timeout);
      }

      const filteredCopy = copy.filter((item) => item.id !== id);
      return filteredCopy;
    });

  useEffect(() => {
    evToast.on("open", onOpen);

    return () => {
      evToast.off("open", onOpen);
      toasters.forEach((toaster) => {
        if (toaster.timeout) {
          clearTimeout(toaster.timeout);
        }
      });
      setToasters([]);
    };

    //eslint-disable-next-line
  }, []);

  return (
    <div id="toast" className={styles.connector}>
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
