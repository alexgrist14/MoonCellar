import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import { ZodValidationException } from "nestjs-zod";
import {
  PROJECT_BLOCK_SCHEMAS,
  ProjectBlockSchema,
  getProjectBlockProgress,
  type ICreateProjectRequest,
  type IProject,
  type IProjectBlock,
  type IProjectToken,
  type IProjectUpload,
  type IUpdateProjectRequest,
} from "@mooncellar/schemas";
import { Project } from "./schemas/project.schema";
import { ProjectData } from "./schemas/project-data.schema";

export const PROJECT_TOKEN_PREFIX = "mcp_";

export const PROJECT_BLOCK_TITLES: Record<IProjectBlock, string> = {
  plan: "Plan",
  decomp: "Decompilation",
};

export const createProjectToken = () =>
  `${PROJECT_TOKEN_PREFIX}${randomBytes(24).toString("base64url")}`;

export const hashProjectToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const readBearerToken = (header?: string) =>
  /^Bearer\s+(\S+)\s*$/i.exec(header ?? "")?.[1] ?? null;

export const isProjectToken = (token: string, tokenHash: string) => {
  const actual = Buffer.from(hashProjectToken(token), "hex");
  const expected = Buffer.from(tokenHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

type IStoredProject = Pick<
  Project,
  "slug" | "name" | "blocks" | "createdAt"
> & {
  uploads?: Project["uploads"];
};

export const toProject = (project: IStoredProject): IProject => ({
  slug: project.slug,
  name: project.name,
  blocks: project.blocks,
  uploads: (project.uploads ?? []).map((upload) => ({
    block: upload.block,
    updatedAt: new Date(upload.updatedAt).toISOString(),
    size: upload.size,
    done: upload.done,
    total: upload.total,
  })),
  createdAt: new Date(project.createdAt).toISOString(),
});

const parseBlock = (block: string): IProjectBlock => {
  const parsed = ProjectBlockSchema.safeParse(block);
  if (!parsed.success) {
    throw new BadRequestException(
      `Unknown block "${block}". Use one of: ${ProjectBlockSchema.options.join(", ")}`
    );
  }
  return parsed.data;
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<Project>,
    @InjectModel(ProjectData.name)
    private readonly data: Model<ProjectData>
  ) {}

  async list(): Promise<IProject[]> {
    const projects = await this.projects.find().sort({ name: 1 }).lean();
    return projects.map(toProject);
  }

  async get(slug: string): Promise<IProject> {
    return toProject(await this.findProject(slug));
  }

  async create(dto: ICreateProjectRequest): Promise<IProjectToken> {
    if (await this.projects.exists({ slug: dto.slug })) {
      throw new ConflictException(
        `The address "${dto.slug}" already belongs to another project`
      );
    }
    const token = createProjectToken();
    const project = await this.projects.create({
      slug: dto.slug,
      name: dto.name,
      blocks: dto.blocks,
      tokenHash: hashProjectToken(token),
      uploads: [],
    });
    return { project: toProject(project), token };
  }

  async update(slug: string, dto: IUpdateProjectRequest): Promise<IProject> {
    const project = await this.findProject(slug);
    const blocks = (dto.blocks ?? project.blocks) as IProjectBlock[];
    const dropped = project.blocks.filter((block) => !blocks.includes(block));
    const updated = await this.projects
      .findOneAndUpdate(
        { slug },
        {
          $set: { name: dto.name ?? project.name, blocks },
          $pull: { uploads: { block: { $in: dropped } } },
        },
        { new: true }
      )
      .lean();
    if (dropped.length) {
      await this.data.deleteMany({ slug, block: { $in: dropped } });
    }
    return toProject(updated ?? project);
  }

  async remove(slug: string): Promise<void> {
    await this.findProject(slug);
    await this.projects.deleteOne({ slug });
    await this.data.deleteMany({ slug });
  }

  async rotateToken(slug: string): Promise<IProjectToken> {
    const project = await this.findProject(slug);
    const token = createProjectToken();
    await this.projects.updateOne(
      { slug },
      { $set: { tokenHash: hashProjectToken(token) } }
    );
    return { project: toProject(project), token };
  }

  async getData(slug: string, rawBlock: string): Promise<string> {
    const block = parseBlock(rawBlock);
    const project = await this.findProject(slug);
    this.assertHasBlock(project, block);
    const stored = await this.data.findOne({ slug, block }).lean();
    if (!stored) {
      throw new NotFoundException(
        `${project.name} has not uploaded its ${PROJECT_BLOCK_TITLES[block]} block yet`
      );
    }
    return stored.body;
  }

  async putData(
    slug: string,
    rawBlock: string,
    authorization: string | undefined,
    body: unknown
  ): Promise<IProjectUpload> {
    const block = parseBlock(rawBlock);
    const token = readBearerToken(authorization);
    if (!token) {
      throw new UnauthorizedException(
        "Send the project's upload token as Authorization: Bearer <token>"
      );
    }
    const project = await this.projects
      .findOne({ slug })
      .select("+tokenHash")
      .lean();
    if (!project || !isProjectToken(token, project.tokenHash)) {
      throw new UnauthorizedException(
        "The upload token does not match this project. Issue a new one in Manage projects and use it"
      );
    }
    this.assertHasBlock(project, block);
    const parsed = PROJECT_BLOCK_SCHEMAS[block].safeParse(body);
    if (!parsed.success) throw new ZodValidationException(parsed.error);

    const json = JSON.stringify(parsed.data);
    const stored = await this.data.findOneAndUpdate(
      { slug, block },
      { $set: { body: json } },
      { upsert: true, new: true }
    );
    const upload = {
      block,
      updatedAt: stored.updatedAt ?? new Date(),
      size: Buffer.byteLength(json),
      ...getProjectBlockProgress(block, parsed.data),
    };
    await this.projects.updateOne({ slug }, { $pull: { uploads: { block } } });
    await this.projects.updateOne({ slug }, { $push: { uploads: upload } });
    return { ...upload, updatedAt: new Date(upload.updatedAt).toISOString() };
  }

  private async findProject(slug: string) {
    const project = await this.projects.findOne({ slug }).lean();
    if (!project) {
      throw new NotFoundException(`There is no project at "${slug}"`);
    }
    return project;
  }

  private assertHasBlock(project: IStoredProject, block: IProjectBlock) {
    if (!project.blocks.includes(block)) {
      throw new BadRequestException(
        `${project.name} has no ${PROJECT_BLOCK_TITLES[block]} block. Add it in Manage projects first`
      );
    }
  }
}
