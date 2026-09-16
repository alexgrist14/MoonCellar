import { FC } from "react";
import classNames from "classnames";
import { IPlaythrough } from "@mooncellar/schemas";
import { commonUtils } from "../../utils/common.utils";
import styles from "./AuthorStatus.module.scss";

interface IAuthorStatusProps {
  category: IPlaythrough["category"];
  time?: number;
  isMastered?: boolean;
}

export const AuthorStatus: FC<IAuthorStatusProps> = ({
  category,
  time,
  isMastered,
}) => (
  <>
    <span className={classNames(styles.status, styles[`status_${category}`])}>
      {commonUtils.upFL(category)}
      {!!time && ` · ${time} h`}
    </span>
    {isMastered && <span className={styles.mastered}>Mastered</span>}
  </>
);
