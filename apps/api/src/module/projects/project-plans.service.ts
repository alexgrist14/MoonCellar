import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { ZodValidationException } from "nestjs-zod";
import {
  PlanBlockSchema,
  getPlanTaskState,
  type ICreatePlanSectionRequest,
  type ICreatePlanTaskRequest,
  type IPlanBlock,
  type IPlanEvent,
  type IPlanTaskAction,
  type IPlanTaskActionRequest,
  type IUpdatePlanSectionRequest,
  type IUpdatePlanTaskRequest,
} from "@mooncellar/schemas";
import {
  ProjectPlan,
  ProjectPlanEvent,
  type PlanTaskEntry,
} from "./schemas/project-plan.schema";
import { ProjectsService } from "./projects.service";

export interface IPlanActor {
  kind: "admin" | "token";
  name: string;
  tokenId?: string;
}

type IStoredPlan = Pick<ProjectPlan, "sections" | "tasks" | "version"> & {
  updatedAt?: Date;
};

const SECTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const toIso = (date: Date | string | null | undefined) =>
  date ? new Date(date).toISOString() : null;

const clean = (value: string | null | undefined) =>
  value === undefined ? undefined : value?.trim() || null;

export const toPlanBlock = (plan: IStoredPlan | null): IPlanBlock => {
  if (!plan) return { version: 0, sections: [] };
  const done = new Set(
    plan.tasks.filter((task) => task.done).map((task) => task.id)
  );
  return {
    version: plan.version,
    sections: plan.sections.map((section) => ({
      id: section.id,
      title: section.title,
      tasks: plan.tasks
        .filter((task) => task.section === section.id)
        .map((task) => {
          const { state, waitsFor } = getPlanTaskState(task, done);
          return {
            id: task.id,
            title: task.title,
            state,
            ...(task.owner && !task.done && { owner: task.owner }),
            ...(waitsFor.length && !task.done && { waitsFor }),
            ...(task.depends.length && { depends: task.depends }),
            ...(task.where && { where: task.where }),
            ...(task.doneWhen && { doneWhen: task.doneWhen }),
            ...(task.size && { size: task.size }),
            ...(task.note && !task.done && { note: task.note }),
            takenAt: task.done ? null : toIso(task.takenAt),
            doneAt: toIso(task.doneAt),
            doneBy: task.doneBy,
          };
        }),
    })),
  };
};

export const nextTaskId = (
  section: string,
  tasks: Pick<PlanTaskEntry, "id">[]
) => {
  const pattern = new RegExp(`^${section}(\\d+)$`);
  const numbers = tasks
    .map((task) => pattern.exec(task.id)?.[1])
    .filter(Boolean)
    .map(Number);
  return `${section}${Math.max(0, ...numbers) + 1}`;
};

export const nextSectionId = (sections: { id: string }[]) => {
  const taken = new Set(sections.map((section) => section.id));
  const single = [...SECTION_LETTERS].find((letter) => !taken.has(letter));
  if (single) return single;
  for (const first of SECTION_LETTERS) {
    for (const second of SECTION_LETTERS) {
      if (!taken.has(first + second)) return first + second;
    }
  }
  throw new ConflictException("The plan has no free section ids left");
};

@Injectable()
export class ProjectPlansService {
  constructor(
    @InjectModel(ProjectPlan.name) private readonly plans: Model<ProjectPlan>,
    @InjectModel(ProjectPlanEvent.name)
    private readonly events: Model<ProjectPlanEvent>,
    private readonly projects: ProjectsService
  ) {}

  async getPlan(slug: string): Promise<IPlanBlock> {
    await this.findPlanProject(slug);
    return toPlanBlock(await this.plans.findOne({ slug }).lean());
  }

  async importPlan(
    slug: string,
    body: unknown,
    actor: IPlanActor
  ): Promise<IPlanBlock> {
    await this.findPlanProject(slug);
    const parsed = PlanBlockSchema.safeParse(body);
    if (!parsed.success) throw new ZodValidationException(parsed.error);
    const existing = await this.plans.findOne({ slug }).lean();
    if (existing?.tasks.length) {
      throw new ConflictException(
        "The plan already lives in the hub. Change it there or through /projects/:slug/plan"
      );
    }
    const now = new Date();
    const sections = parsed.data.sections.map(({ id, title }) => ({
      id,
      title,
    }));
    const tasks: PlanTaskEntry[] = parsed.data.sections.flatMap((section) =>
      section.tasks.map((task) => ({
        id: task.id,
        section: section.id,
        title: task.title,
        where: task.where ?? null,
        depends: task.depends ?? task.waitsFor ?? [],
        doneWhen: task.doneWhen ?? null,
        size: task.size ?? null,
        done: task.state === "done",
        doneAt: task.doneAt ? new Date(task.doneAt) : null,
        doneBy: task.doneBy ?? null,
        owner: task.state === "taken" ? (task.owner ?? null) : null,
        takenAt: task.takenAt ? new Date(task.takenAt) : null,
        note: task.note ?? null,
        createdAt: now,
        createdBy: actor.name,
      }))
    );
    const plan = await this.plans
      .findOneAndUpdate(
        { slug },
        { $set: { sections, tasks }, $inc: { version: 1 } },
        { upsert: true, new: true }
      )
      .lean();
    await this.log(slug, actor, "import", { text: `${tasks.length} tasks` });
    return this.afterChange(slug, plan);
  }

  async createSection(
    slug: string,
    dto: ICreatePlanSectionRequest,
    actor: IPlanActor
  ): Promise<IPlanBlock> {
    await this.findPlanProject(slug);
    const plan = await this.plans.findOne({ slug }).lean();
    const id = dto.id ?? nextSectionId(plan?.sections ?? []);
    if (plan?.sections.some((section) => section.id === id)) {
      throw new ConflictException(`The plan already has a section ${id}`);
    }
    const updated = await this.plans
      .findOneAndUpdate(
        { slug, "sections.id": { $ne: id } },
        { $push: { sections: { id, title: dto.title } }, $inc: { version: 1 } },
        { upsert: true, new: true }
      )
      .lean();
    await this.log(slug, actor, "section", { sectionId: id, text: dto.title });
    return this.afterChange(slug, updated);
  }

  async updateSection(
    slug: string,
    sectionId: string,
    dto: IUpdatePlanSectionRequest,
    actor: IPlanActor
  ): Promise<IPlanBlock> {
    const updated = await this.plans
      .findOneAndUpdate(
        { slug, "sections.id": sectionId },
        { $set: { "sections.$.title": dto.title }, $inc: { version: 1 } },
        { new: true }
      )
      .lean();
    if (!updated) throw this.noSection(sectionId);
    await this.log(slug, actor, "rename-section", {
      sectionId,
      text: dto.title,
    });
    return this.afterChange(slug, updated);
  }

  async deleteSection(
    slug: string,
    sectionId: string,
    actor: IPlanActor
  ): Promise<IPlanBlock> {
    const plan = await this.plans.findOne({ slug }).lean();
    if (!plan?.sections.some((section) => section.id === sectionId)) {
      throw this.noSection(sectionId);
    }
    if (plan.tasks.some((task) => task.section === sectionId)) {
      throw new ConflictException(
        `Section ${sectionId} still has tasks; move or delete them first`
      );
    }
    const updated = await this.plans
      .findOneAndUpdate(
        { slug, tasks: { $not: { $elemMatch: { section: sectionId } } } },
        { $pull: { sections: { id: sectionId } }, $inc: { version: 1 } },
        { new: true }
      )
      .lean();
    if (!updated) {
      throw new ConflictException(`Section ${sectionId} got a task meanwhile`);
    }
    await this.log(slug, actor, "delete-section", { sectionId });
    return this.afterChange(slug, updated);
  }

  async createTask(
    slug: string,
    dto: ICreatePlanTaskRequest,
    actor: IPlanActor
  ): Promise<IPlanBlock> {
    await this.findPlanProject(slug);
    for (let attempt = 0; attempt < 3; attempt++) {
      const plan = await this.plans.findOne({ slug }).lean();
      if (!plan?.sections.some((section) => section.id === dto.section)) {
        throw this.noSection(dto.section);
      }
      this.assertKnownTasks(plan, dto.depends);
      const id = nextTaskId(dto.section, plan.tasks);
      const task: PlanTaskEntry = {
        id,
        section: dto.section,
        title: dto.title,
        where: clean(dto.where) ?? null,
        depends: dto.depends ?? [],
        doneWhen: clean(dto.doneWhen) ?? null,
        size: clean(dto.size) ?? null,
        done: false,
        doneAt: null,
        doneBy: null,
        owner: null,
        takenAt: null,
        note: null,
        createdAt: new Date(),
        createdBy: actor.name,
      };
      const updated = await this.plans
        .findOneAndUpdate(
          { slug, "tasks.id": { $ne: id } },
          { $push: { tasks: task }, $inc: { version: 1 } },
          { new: true }
        )
        .lean();
      if (updated) {
        await this.log(slug, actor, "create", { taskId: id, text: dto.title });
        return this.afterChange(slug, updated);
      }
    }
    throw new ConflictException("Others are adding tasks right now; try again");
  }

  async updateTask(
    slug: string,
    taskId: string,
    dto: IUpdatePlanTaskRequest,
    actor: IPlanActor
  ): Promise<IPlanBlock> {
    const plan = await this.plans.findOne({ slug }).lean();
    if (!plan?.tasks.some((task) => task.id === taskId))
      throw this.noTask(taskId);
    if (
      dto.section &&
      !plan.sections.some((section) => section.id === dto.section)
    ) {
      throw this.noSection(dto.section);
    }
    if (dto.depends?.includes(taskId)) {
      throw new BadRequestException(`${taskId} cannot depend on itself`);
    }
    this.assertKnownTasks(plan, dto.depends);
    const set: Record<string, unknown> = {};
    if (dto.title !== undefined) set["tasks.$.title"] = dto.title;
    if (dto.section !== undefined) set["tasks.$.section"] = dto.section;
    if (dto.depends !== undefined) set["tasks.$.depends"] = dto.depends;
    for (const key of ["where", "doneWhen", "size"] as const) {
      if (dto[key] !== undefined) set[`tasks.$.${key}`] = clean(dto[key]);
    }
    const updated = await this.plans
      .findOneAndUpdate(
        { slug, "tasks.id": taskId },
        { $set: set, $inc: { version: 1 } },
        { new: true }
      )
      .lean();
    if (!updated) throw this.noTask(taskId);
    await this.log(slug, actor, "edit", { taskId });
    return this.afterChange(slug, updated);
  }

  async deleteTask(
    slug: string,
    taskId: string,
    actor: IPlanActor
  ): Promise<IPlanBlock> {
    const updated = await this.plans
      .findOneAndUpdate(
        { slug, "tasks.id": taskId },
        { $pull: { tasks: { id: taskId } }, $inc: { version: 1 } },
        { new: true }
      )
      .lean();
    if (!updated) throw this.noTask(taskId);
    await this.log(slug, actor, "delete", { taskId });
    return this.afterChange(slug, updated);
  }

  async act(
    slug: string,
    taskId: string,
    action: IPlanTaskAction,
    dto: IPlanTaskActionRequest,
    actor: IPlanActor
  ): Promise<IPlanBlock> {
    const name = dto.as ?? (actor.kind === "admin" ? actor.name : undefined);
    if (!name) {
      throw new BadRequestException(
        "Say whose action this is: send as, the person's name"
      );
    }
    const plan = await this.plans.findOne({ slug }).lean();
    const task = plan?.tasks.find((item) => item.id === taskId);
    if (!plan || !task) throw this.noTask(taskId);
    const isOther = (owner: string | null) =>
      !!owner && owner.toLowerCase() !== name.toLowerCase();
    const now = new Date();

    let set: Record<string, unknown>;
    if (action === "take") {
      if (task.done) throw new ConflictException(`${taskId} is already done`);
      if (isOther(task.owner) && !dto.force) {
        throw new ConflictException(`${taskId} is taken by ${task.owner}`);
      }
      set = {
        "tasks.$.owner": name,
        "tasks.$.takenAt": now,
        "tasks.$.note": clean(dto.note) ?? null,
      };
    } else if (action === "release") {
      if (!task.owner) throw new ConflictException(`${taskId} is not taken`);
      if (isOther(task.owner) && !dto.force) {
        throw new ConflictException(
          `${taskId} is taken by ${task.owner}, not by ${name}`
        );
      }
      set = {
        "tasks.$.owner": null,
        "tasks.$.takenAt": null,
        "tasks.$.note": null,
      };
    } else if (action === "done") {
      if (task.done) throw new ConflictException(`${taskId} is already done`);
      if (isOther(task.owner) && !dto.force) {
        throw new ConflictException(
          `${taskId} is taken by ${task.owner}; only they mark it done`
        );
      }
      set = {
        "tasks.$.done": true,
        "tasks.$.doneAt": now,
        "tasks.$.doneBy": name,
        "tasks.$.owner": null,
        "tasks.$.takenAt": null,
        "tasks.$.note": null,
      };
    } else {
      if (!task.done) throw new ConflictException(`${taskId} is not done`);
      set = {
        "tasks.$.done": false,
        "tasks.$.doneAt": null,
        "tasks.$.doneBy": null,
      };
    }

    const updated = await this.plans
      .findOneAndUpdate(
        {
          slug,
          tasks: {
            $elemMatch: { id: taskId, owner: task.owner, done: task.done },
          },
        },
        { $set: set, $inc: { version: 1 } },
        { new: true }
      )
      .lean();
    if (!updated) {
      throw new ConflictException(
        `${taskId} changed meanwhile; reload the plan and try again`
      );
    }
    await this.log(slug, { ...actor, name }, action, {
      taskId,
      text: clean(dto.note) ?? undefined,
    });
    if (actor.tokenId) await this.projects.touchToken(slug, actor.tokenId);
    return this.afterChange(slug, updated);
  }

  async listEvents(slug: string, taskId?: string): Promise<IPlanEvent[]> {
    const events = await this.events
      .find({ slug, ...(taskId && { taskId }) })
      .sort({ at: -1 })
      .limit(taskId ? 50 : 100)
      .lean();
    return events.map((event) => ({
      at: event.at.toISOString(),
      by: event.by,
      action: event.action,
      ...(event.taskId && { taskId: event.taskId }),
      ...(event.sectionId && { sectionId: event.sectionId }),
      ...(event.text && { text: event.text }),
    }));
  }

  private async findPlanProject(slug: string) {
    const project = await this.projects.findProject(slug);
    this.projects.assertHasBlock(project, "plan");
    return project;
  }

  private assertKnownTasks(plan: IStoredPlan, ids?: string[]) {
    const known = new Set(plan.tasks.map((task) => task.id));
    const unknown = (ids ?? []).filter((id) => !known.has(id));
    if (unknown.length) {
      throw new BadRequestException(
        `No such task in the plan: ${unknown.join(", ")}`
      );
    }
  }

  private async afterChange(slug: string, plan: IStoredPlan | null) {
    const block = toPlanBlock(plan);
    const tasks = block.sections.flatMap((section) => section.tasks);
    await this.projects.recordProgress(slug, "plan", {
      done: tasks.filter((task) => task.state === "done").length,
      total: tasks.length,
      size: 0,
    });
    return block;
  }

  private log(
    slug: string,
    actor: IPlanActor,
    action: string,
    details: { taskId?: string; sectionId?: string; text?: string }
  ) {
    return this.events.create({
      slug,
      at: new Date(),
      by: actor.name,
      action,
      taskId: details.taskId ?? null,
      sectionId: details.sectionId ?? null,
      text: details.text?.slice(0, 300) ?? null,
    });
  }

  private noTask(taskId: string) {
    return new NotFoundException(`There is no task ${taskId} in the plan`);
  }

  private noSection(sectionId: string) {
    return new NotFoundException(
      `There is no section ${sectionId} in the plan`
    );
  }
}
