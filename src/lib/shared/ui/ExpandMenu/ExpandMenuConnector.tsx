"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import EventEmitter from "events";
import { IExpandPosition } from "../../store/common.store";
import { ExpandMenu } from "./ExpandMenu";
import { CheckMobile } from "../CheckMobile";

const ev = new EventEmitter();

interface IExpandOpenProps {
  component: ReactNode;
  options: { position: IExpandPosition; id?: string };
}

interface IExpandControl {
  set: (props: IExpandOpenProps) => void;
}

export const expand: IExpandControl = {
  set: ({ component, options }) => {
    ev.emit("open", { component, options });
  },
};

export const ExpandConnector = () => {
  const [content, setContent] = useState<IExpandOpenProps[]>([]);

  const setExpanded = useMemo(() => {
    return ({ component, options }: IExpandOpenProps) => {
      setContent((items) => [...items, { component, options }]);
    };
  }, []);

  useEffect(() => {
    ev.on("open", setExpanded);

    return () => {
      ev.off("open", setExpanded);
    };
  }, [setExpanded]);

  return (
    <div id="expand">
      <CheckMobile>
        {content.map(({ component, options }, i) => (
          <ExpandMenu key={i} {...options}>
            {component}
          </ExpandMenu>
        ))}
      </CheckMobile>
    </div>
  );
};
