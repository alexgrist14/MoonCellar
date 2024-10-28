import { useEffect, useMemo, useState } from "react";
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

  const openModal = useMemo(() => {
    return ({ component, props, id }: IModalPropsState) => {
      setContent((st) => [...st, { component, props, id }]);
    };
  }, []);

  const closeModal = useMemo(
    () => (id?: string) => {
      if (!id) setContent([]);
      else {
        setContent((st) => st.filter((prop) => prop.id !== id));
      }
    },
    [setContent]
  );

  useEffect(() => {
    ev.on("open", openModal);
    ev.on("close", closeModal);

    return () => {
      ev.off("open", openModal);
      ev.off("close", closeModal);
    };
  }, [openModal, closeModal]);

  return (
    <div id="modals">
      {content.map(({ component, props }, i) => (
        <Modal
          key={i}
          onClose={() => {
            closeModal(props?.id);
            if (props?.onClose) props.onClose();
          }}
        >
          {component}
        </Modal>
      ))}
    </div>
  );
};
