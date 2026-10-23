import { z } from "zod";

export const ProjectBlockSchema = z.enum(["decomp", "plan"]);
export type IProjectBlock = z.infer<typeof ProjectBlockSchema>;

export const PROJECT_BLOCKS: readonly IProjectBlock[] =
  ProjectBlockSchema.options;

export const RESERVED_PROJECT_SLUGS = [
  "login",
  "manage",
  "status",
  "api",
  "images",
  "img",
];

export const ProjectSlugSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/,
    "Use 1–40 lowercase letters, digits and dashes, not starting or ending with a dash"
  )
  .refine(
    (slug) => !RESERVED_PROJECT_SLUGS.includes(slug),
    "This address is used by the status hub itself"
  );

export const ProjectUploadSchema = z.object({
  block: ProjectBlockSchema,
  updatedAt: z.string(),
  size: z.number().int().nonnegative(),
  done: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
export type IProjectUpload = z.infer<typeof ProjectUploadSchema>;

export const ProjectSchema = z.object({
  slug: ProjectSlugSchema,
  name: z.string(),
  blocks: z.array(ProjectBlockSchema),
  uploads: z.array(ProjectUploadSchema),
  createdAt: z.string(),
});
export type IProject = z.infer<typeof ProjectSchema>;

const ProjectBlocksFieldSchema = z
  .array(ProjectBlockSchema)
  .min(1, "Choose at least one block")
  .transform((blocks) =>
    PROJECT_BLOCKS.filter((block) => blocks.includes(block))
  );

export const CreateProjectRequestSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: ProjectSlugSchema,
  blocks: ProjectBlocksFieldSchema,
});
export type ICreateProjectRequest = z.input<typeof CreateProjectRequestSchema>;

export const UpdateProjectRequestSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  blocks: ProjectBlocksFieldSchema.optional(),
});
export type IUpdateProjectRequest = z.input<typeof UpdateProjectRequestSchema>;

export const ProjectTokenSchema = z.object({
  project: ProjectSchema,
  token: z.string(),
});
export type IProjectToken = z.infer<typeof ProjectTokenSchema>;

export const PlanTaskStateSchema = z.enum(["done", "taken", "free", "waiting"]);
export type IPlanTaskState = z.infer<typeof PlanTaskStateSchema>;

export const PlanTaskSchema = z.object({
  id: z.string().trim().min(1).max(16),
  title: z.string().max(20_000),
  state: PlanTaskStateSchema,
  owner: z.string().max(64).optional(),
  waitsFor: z.array(z.string().max(16)).max(50).optional(),
  where: z.string().max(4_000).optional(),
  doneWhen: z.string().max(4_000).optional(),
  size: z.string().max(8).optional(),
});
export type IPlanTask = z.infer<typeof PlanTaskSchema>;

export const PlanSectionSchema = z.object({
  id: z.string().max(16),
  title: z.string().max(200),
  tasks: z.array(PlanTaskSchema).max(1_000),
});
export type IPlanSection = z.infer<typeof PlanSectionSchema>;

export const PlanBlockSchema = z.object({
  commit: z.string().max(64).optional(),
  sections: z.array(PlanSectionSchema).max(100),
});
export type IPlanBlock = z.infer<typeof PlanBlockSchema>;

const CountSchema = z.number().int().nonnegative();

export const DecompProgressSchema = z.object({
  functions: CountSchema,
  done: CountSchema,
  pending: CountSchema,
  bytes: CountSchema,
  bytesDone: CountSchema,
});
export type IDecompProgress = z.infer<typeof DecompProgressSchema>;

export const DecompCategorySchema = DecompProgressSchema.extend({
  id: z.string().max(64),
});
export type IDecompCategory = z.infer<typeof DecompCategorySchema>;

export const DecompAreaSchema = z.object({
  id: z.string().max(64),
  title: z.string().max(120).optional(),
  owners: z.array(z.string().max(64)).max(20),
  functions: CountSchema,
  done: CountSchema,
});
export type IDecompArea = z.infer<typeof DecompAreaSchema>;

export const DecompUnitSchema = DecompProgressSchema.extend({
  id: z.string().max(300),
  category: z.string().max(64),
  area: z.string().max(64).optional(),
  claimedBy: z.string().max(64).optional(),
  note: z.string().max(300).optional(),
});
export type IDecompUnit = z.infer<typeof DecompUnitSchema>;

export const DecompEventKindSchema = z.enum([
  "merge",
  "push",
  "commit",
  "claim",
  "release",
  "done",
  "area",
]);
export type IDecompEventKind = z.infer<typeof DecompEventKindSchema>;

export const DecompEventSchema = z.object({
  at: z.string(),
  kind: DecompEventKindSchema,
  text: z.string().max(500),
  who: z.string().max(64).optional(),
});
export type IDecompEvent = z.infer<typeof DecompEventSchema>;

export const DECOMP_MAP_CELLS = {
  done: "d",
  pending: "p",
  claimed: "t",
  todo: ".",
} as const;

export const DecompBlockSchema = z.object({
  commit: z.string().max(64).optional(),
  totals: DecompProgressSchema.extend({ claimed: CountSchema }),
  categories: z.array(DecompCategorySchema).max(100),
  areas: z.array(DecompAreaSchema).max(100),
  units: z.array(DecompUnitSchema).max(20_000),
  map: z
    .string()
    .max(500_000)
    .regex(/^[dpt.]*$/, "The map holds one of d, p, t or . per function"),
  events: z.array(DecompEventSchema).max(200),
});
export type IDecompBlock = z.infer<typeof DecompBlockSchema>;

export const PROJECT_BLOCK_SCHEMAS = {
  plan: PlanBlockSchema,
  decomp: DecompBlockSchema,
} as const;

export const getProjectBlockProgress = (
  block: IProjectBlock,
  data: IPlanBlock | IDecompBlock
): { done: number; total: number } => {
  if (block === "decomp") {
    const { totals } = data as IDecompBlock;
    return { done: totals.done, total: totals.functions };
  }
  const tasks = (data as IPlanBlock).sections.flatMap(
    (section) => section.tasks
  );
  return {
    done: tasks.filter((task) => task.state === "done").length,
    total: tasks.length,
  };
};
