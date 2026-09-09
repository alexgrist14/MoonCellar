import { FC } from "react";
import styles from "./Errors.module.scss";
import { IErrorMessage } from "../../types/error.types";

interface IErrorsProps {
  errors: IErrorMessage[];
}

export const Errors: FC<IErrorsProps> = ({ errors }) => {
  if (!errors?.length) return null;

  return (
    <div>
      {errors.map((error, i) => (
        <p key={i} className={styles.errors__error}>
          <span className={styles.errors__title}>{error.title}: </span>
          <span className={styles.errors__description}>
            {error.description}
          </span>
        </p>
      ))}
    </div>
  );
};
