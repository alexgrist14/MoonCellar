import { FC } from "react";
import { IPlanTask } from "@mooncellar/schemas";
import { PlanStateBadge } from "./PlanStateBadge";
import { PlanText } from "./PlanText";
import styles from "./PlanBlock.module.scss";

export const PlanTaskDetails: FC<{ task: IPlanTask }> = ({ task }) => (
  <div className={styles.details}>
    <div className={styles.details__state}>
      <PlanStateBadge task={task} />
      {task.size && (
        <span className={styles.details__size}>Size {task.size}</span>
      )}
    </div>
    <p className={styles.details__text}>
      <PlanText text={task.title} />
    </p>
    {task.where && (
      <div className={styles.details__fact}>
        <h4>Where</h4>
        <p>
          <PlanText text={task.where} />
        </p>
      </div>
    )}
    {task.doneWhen && (
      <div className={styles.details__fact}>
        <h4>Done when</h4>
        <p>
          <PlanText text={task.doneWhen} />
        </p>
      </div>
    )}
  </div>
);
