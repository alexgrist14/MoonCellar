import { FC } from "react";
import Image from "next/image";
import classNames from "classnames";
import styles from "./fields.module.scss";

export interface IImagePickerOption {
  url: string;
  caption: string;
}

interface IImagePickerFieldProps {
  label: string;
  value?: string | null;
  options: IImagePickerOption[];
  autoCaption: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export const ImagePickerField: FC<IImagePickerFieldProps> = ({
  label,
  value,
  options,
  autoCaption,
  onChange,
  disabled,
}) => {
  const isAuto = !value || !options.some((option) => option.url === value);

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {!options.length ? (
        <span className={styles.hint}>
          No screenshots or artworks yet. {autoCaption}.
        </span>
      ) : (
        <div className={styles.picker} role="radiogroup" aria-label={label}>
          <button
            type="button"
            role="radio"
            aria-checked={isAuto}
            disabled={disabled}
            className={classNames(styles.picker__tile, styles.picker__tile_auto, {
              [styles.picker__tile_active]: isAuto,
            })}
            onClick={() => onChange(null)}
          >
            <span className={styles.picker__preview}>Automatic</span>
            <span className={styles.picker__caption}>{autoCaption}</span>
          </button>
          {options.map((option) => {
            const isActive = !isAuto && option.url === value;

            return (
              <button
                key={option.url}
                type="button"
                role="radio"
                aria-checked={isActive}
                disabled={disabled}
                className={classNames(styles.picker__tile, {
                  [styles.picker__tile_active]: isActive,
                })}
                onClick={() => onChange(option.url)}
              >
                <span className={styles.picker__preview}>
                  <Image
                    src={option.url}
                    alt=""
                    fill
                    sizes="160px"
                    className={styles.picker__image}
                  />
                </span>
                <span className={styles.picker__caption}>{option.caption}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
