import { z } from "zod";
import { ConflictSourceSchema, ConflictStateSchema } from "./conflicts.schema";

export const CONFLICTS_SOCKET_NAMESPACE = "/conflicts";

export enum ConflictsSocketEvent {
  CONFLICT_DECIDED = "conflict:decided",
  CONFLICTS_APPLIED = "conflicts:applied",
}

export const ConflictDecidedEventSchema = z.object({
  source: ConflictSourceSchema,
  externalId: z.string(),
  state: ConflictStateSchema.describe("State after the decision"),
  decidedBy: z.string().nullable().describe("Admin who decided"),
});

export const ConflictsAppliedEventSchema = z.object({
  source: ConflictSourceSchema,
  externalIds: z
    .string()
    .array()
    .describe(
      "Entries whose decisions were written to games or returned to review"
    ),
});

export type IConflictDecidedEvent = z.infer<typeof ConflictDecidedEventSchema>;
export type IConflictsAppliedEvent = z.infer<
  typeof ConflictsAppliedEventSchema
>;

export type IConflictsClientEvents = Record<string, never>;

export type IConflictsServerEvents = {
  [ConflictsSocketEvent.CONFLICT_DECIDED]: (
    event: IConflictDecidedEvent
  ) => void;
  [ConflictsSocketEvent.CONFLICTS_APPLIED]: (
    event: IConflictsAppliedEvent
  ) => void;
};
