import { z } from "zod";

export const IGDB_ORPHANS_DEFAULT_LIMIT = 500;

export const StartIgdbOrphansRequestSchema = z.object({
  apply: z
    .boolean()
    .optional()
    .describe(
      "Unlink and delete the orphans; without it the run only reports. Irreversible"
    ),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      `Maximum number of games deleted in this run (default ${IGDB_ORPHANS_DEFAULT_LIMIT})`
    ),
});

export const IgdbOrphanReasonSchema = z.enum([
  "vndb-owned",
  "custom",
  "user-data",
  "orphan",
]);

export const IgdbOrphanEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  igdbId: z.number(),
  reason: IgdbOrphanReasonSchema,
});

export const IgdbOrphansRunSchema = z.object({
  running: z.boolean(),
  trigger: z.enum(["manual", "cron"]),
  apply: z.boolean(),
  limit: z.number(),
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  error: z.string().optional(),
  refusedReason: z
    .string()
    .optional()
    .describe("Set when the run refused to write anything"),
  scanned: z.number(),
  missing: z.number().describe("Games whose IGDB id IGDB no longer returns"),
  deleted: z.number(),
  unlinked: z.number(),
  kept: z.number(),
  deferred: z
    .number()
    .describe("Plain orphans left for a later run by the delete limit"),
  failed: z.number(),
  deletedGames: z.array(IgdbOrphanEntrySchema),
  unlinkedGames: z.array(IgdbOrphanEntrySchema),
  keptGames: z.array(IgdbOrphanEntrySchema),
});

export type IStartIgdbOrphansRequest = z.infer<
  typeof StartIgdbOrphansRequestSchema
>;
export type IIgdbOrphanReason = z.infer<typeof IgdbOrphanReasonSchema>;
export type IIgdbOrphanEntry = z.infer<typeof IgdbOrphanEntrySchema>;
export type IIgdbOrphansRun = z.infer<typeof IgdbOrphansRunSchema>;
