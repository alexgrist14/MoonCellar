import { FC, HTMLAttributes, HTMLInputTypeAttribute, useState } from "react";
import styles from "./ListController.module.scss";
import { Input } from "../Input";
import { Button } from "../Button";
import { SvgClose } from "../svg";
import classNames from "classnames";
import { toast } from "../../utils/toast";

interface IListControllerProps
  extends Pick<HTMLAttributes<HTMLDivElement>, "onFocus"> {
  list: string[];
  removeCallback: (value: string, index?: number) => void;
  addCallback: (value: string, index?: number) => void;
  addText?: string;
  type?: HTMLInputTypeAttribute;
  validation?: (value: string) => boolean;
  validationMessage?: string;
  required?: boolean;
}

export const ListController: FC<IListControllerProps> = ({
  addCallback,
  list,
  removeCallback,
  addText,
  type = "text",
  validation,
  validationMessage,
  onFocus,
}) => {
  const [value, setValue] = useState("");

  const add = () => {
    (!!validation && validation(value)) || !validation
      ? addCallback(value)
      : toast.error({ title: validationMessage });
  };

  return (
    <div className={styles.controller} onFocus={onFocus}>
      <div className={styles.controller__add}>
        <Input
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button
          type="button"
          className={styles.controller__button}
          onClick={(e) => {
            e.preventDefault();
            !!value && add();
          }}
        >
          {addText || "Добавить"}
        </Button>
      </div>
      {!!list?.length && (
        <div className={styles.controller__list}>
          {list.map((item, i) => (
            <div key={i} className={styles.controller__item}>
              <p className={styles.controller__title}>{item}</p>
              <Button
                type="button"
                className={classNames(
                  styles.controller__button,
                  styles.controller__button_remove
                )}
                color="red"
                onClick={(e) => {
                  e.preventDefault();
                  removeCallback(item, i);
                }}
              >
                <SvgClose />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
