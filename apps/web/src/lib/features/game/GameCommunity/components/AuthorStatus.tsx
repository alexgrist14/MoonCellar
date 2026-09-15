import { FC } from "react";
import classNames from "classnames";
import { IPlaythrough } from "@mooncellar/schemas";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "../GameCommunity.module.scss";

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
      {typeof time === "number" && ` · ${time} h`}
    </span>
    {isMastered && <span className={styles.mastered}>Mastered</span>}
  </>
);
