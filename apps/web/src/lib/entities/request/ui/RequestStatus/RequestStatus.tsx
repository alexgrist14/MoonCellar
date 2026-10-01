import { FC } from "react";
import { IContentRequestStatus } from "@mooncellar/schemas";
import { Badge, BadgeTone } from "@/src/lib/shared/ui/Badge";

const LABELS: Record<IContentRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const TONES: Record<IContentRequestStatus, BadgeTone> = {
  pending: "attention",
  approved: "positive",
  rejected: "negative",
  withdrawn: "muted",
};

export const RequestStatus: FC<{ status: IContentRequestStatus }> = ({
  status,
}) => (
  <Badge tone={TONES[status]} size="md" isWithDot>
    {LABELS[status]}
  </Badge>
);
