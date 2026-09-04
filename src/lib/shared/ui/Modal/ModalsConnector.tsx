import { useCallback, useEffect, useState } from "react";
import EventEmitter from "events";
import { IModal, IModalPropsState } from "./Modal.types";
import { Modal } from "./Modal";

const ev = new EventEmitter();

export const modal: IModal = {
  open: (component, props) => {
    ev.emit("open", { component, props });
  },
  close: (id) => {
    ev.emit("close", id);
  },
};

export const ModalsConnector = () => {
  const [content, setContent] = useState<IModalPropsState[]>([]);

  const closeLastModal = useCallback(() => {
    setContent((st) => st.slice(0, -1));
  }, []);

  const closeAllModals = useCallback(() => {
    setContent((st) => (st.length ? [] : st));
  }, []);

  const openModal = useCallback(({ component, props }: IModalPropsState) => {
    setContent((st) => [...st, { component, props }]);
  }, []);

  const closeModal = useCallback((id?: string) => {
    setContent((st) => (!id ? [] : st.filter((item) => item.props.id !== id)));
  }, []);

  useEffect(() => {
    ev.on("open", openModal);
    ev.on("close", closeModal);

    return () => {
      ev.off("open", openModal);
      ev.off("close", closeModal);
    };
  }, [openModal, closeModal]);

  useEffect(() => {
    window.addEventListener("popstate", closeAllModals);

    return () => window.removeEventListener("popstate", closeAllModals);
  }, [closeAllModals]);

  return (
    <div
      id="modals"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          closeLastModal();
        }
      }}
    >
      {content.map(({ component, props }, i) => (
        <Modal key={i} {...props}>
          {component}
        </Modal>
      ))}
    </div>
  );
};
