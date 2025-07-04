import { FC, useEffect, useMemo, useRef, useState } from "react";
import { ITextareaProps } from "./Textarea.type";
import cn from "classnames";
import styles from "./Textarea.module.scss";
import { SvgResize } from "../svg";
import classNames from "classnames";
import { useAutoResizeTextArea } from "../../hooks";

export const Textarea: FC<ITextareaProps> = ({
  className,
  error,
  classNameField,
  clearErrors,
  resize = false,
  style,
  children,
  onChange,
  ref,
  isDisableAutoResize,
  ...props
}) => {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const replicaRef = useRef<HTMLDivElement>(null);

  const [replicaValue, setReplicaValue] = useState("");
  const [height, setHeight] = useState<number>();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const fakeImage = useMemo(() => {
    if (typeof window !== "undefined") {
      const image = new Image();

      image.src =
        "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";

      return image;
    }
  }, []);

  useAutoResizeTextArea({
    isDisabled: isDisableAutoResize,
    textAreaRef: textRef,
    replicaRef: replicaRef,
    value: replicaValue || textRef.current?.value || "",
  });

  useEffect(() => {
    const callback = (e: DragEvent) => {
      setMousePosition({ x: e.x, y: e.y });
    };

    document.addEventListener("dragover", callback);

    return () => document.removeEventListener("dragover", callback);
  }, []);

  return (
    <div className={cn(styles.textarea, className)}>
      <textarea
        className={cn(classNameField, styles.textarea__field, {
          [styles.textarea__field_error]: !!error?.message,
        })}
        style={{
          ...style,
          ...(!!height && resize && { height: Math.round(height) + "px" }),
        }}
        ref={(node) => {
          textRef.current = node;

          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        onClick={() => {
          if (clearErrors && props.name) clearErrors(props.name);
        }}
        onChange={(e) => {
          setReplicaValue(e.target.value);
          !!onChange && onChange(e);
        }}
        {...props}
      ></textarea>
      {resize && (
        <div
          onDrag={() => {
            if (!textRef.current) return;

            const rect = textRef.current.getBoundingClientRect();

            setHeight(mousePosition.y - rect.top);
          }}
          onDragStart={(e) =>
            !!fakeImage && e.dataTransfer.setDragImage(fakeImage, 0, 0)
          }
          draggable="true"
          className={styles.textarea__wrapper}
        >
          <SvgResize className={styles.textarea__corner} />
        </div>
      )}
      {children}
      {resize && !isDisableAutoResize && (
        <div
          ref={replicaRef}
          className={classNames(styles.textarea__replica, classNameField)}
          style={style}
        >
          {(replicaValue || textRef.current?.value) + " "}
        </div>
      )}
    </div>
  );
};
