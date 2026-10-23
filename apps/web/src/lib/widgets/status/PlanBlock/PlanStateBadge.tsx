import { FC } from "react";
import { IPlanTask } from "@mooncellar/schemas";
import { Badge, BadgeTone } from "@/src/lib/shared/ui/Badge";

const TONES: Record<IPlanTask["state"], BadgeTone> = {
  done: "positive",
  taken: "accent",
  waiting: "attention",
  free: "muted",
};

const getLabel = (task: IPlanTask) => {
  if (task.state === "done") return "Done";
  if (task.state === "taken") return task.owner ?? "In progress";
  if (task.state === "waiting") {
    return task.waitsFor?.length
      ? `Waits for ${task.waitsFor.join(", ")}`
      : "Waiting";
  }
  return "Free";
};

export const PlanStateBadge: FC<{ task: IPlanTask }> = ({ task }) => (
  <Badge tone={TONES[task.state]} isWithDot>
    {getLabel(task)}
  </Badge>
);
