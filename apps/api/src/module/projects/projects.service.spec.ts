import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ZodValidationException } from "nestjs-zod";
import {
  ProjectsService,
  hashProjectToken,
  isProjectToken,
  readBearerToken,
} from "./projects.service";

const TOKEN = "mcp_secret";
const CREATED = new Date("2026-10-23T10:00:00Z");

const plan = {
  sections: [
    {
      id: "H",
      title: "Status hub",
      tasks: [
        { id: "H1", title: "Sign-in page", state: "done" },
        { id: "H2", title: "Plan block", state: "free" },
      ],
    },
  ],
};

const chain = <T>(value: T) => {
  const query = {
    select: jest.fn(() => query),
    sort: jest.fn(() => query),
    lean: jest.fn().mockResolvedValue(value),
  };
  return query;
};

const createService = (stored: Record<string, unknown> | null) => {
  const project = stored && {
    slug: "mooncellar",
    name: "MoonCellar",
    blocks: ["plan"],
    uploads: [],
    tokenHash: hashProjectToken(TOKEN),
    createdAt: CREATED,
    ...stored,
  };
  const projects = {
    findOne: jest.fn(() => chain(project)),
    find: jest.fn(() => chain(project ? [project] : [])),
    exists: jest.fn().mockResolvedValue(project ? { _id: "x" } : null),
    create: jest.fn(async (doc: Record<string, unknown>) => ({
      ...doc,
      createdAt: CREATED,
    })),
    updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
    findOneAndUpdate: jest.fn(() => chain(project)),
    deleteOne: jest.fn(),
  };
  const data = {
    findOne: jest.fn(() => chain(null)),
    findOneAndUpdate: jest.fn(async () => ({ updatedAt: CREATED })),
    deleteMany: jest.fn(),
  };
  const service = new ProjectsService(projects as never, data as never);
  return { service, projects, data };
};

describe("project tokens", () => {
  it("reads a bearer token", () => {
    expect(readBearerToken("Bearer abc")).toBe("abc");
    expect(readBearerToken("bearer abc ")).toBe("abc");
    expect(readBearerToken("Basic abc")).toBeNull();
    expect(readBearerToken(undefined)).toBeNull();
  });

  it("matches only the token the hash was made from", () => {
    expect(isProjectToken(TOKEN, hashProjectToken(TOKEN))).toBe(true);
    expect(isProjectToken("mcp_other", hashProjectToken(TOKEN))).toBe(false);
  });
});

describe("ProjectsService.create", () => {
  it("stores only the hash and returns the token once", async () => {
    const { service, projects } = createService(null);
    const result = await service.create({
      name: "Glassline",
      slug: "glassline",
      blocks: ["plan"],
    });
    expect(result.token).toMatch(/^mcp_/);
    const stored = projects.create.mock.calls[0][0];
    expect(stored.tokenHash).toBe(hashProjectToken(result.token));
    expect(stored).not.toHaveProperty("token");
    expect(result.project).toEqual({
      slug: "glassline",
      name: "Glassline",
      blocks: ["plan"],
      uploads: [],
      createdAt: CREATED.toISOString(),
    });
  });

  it("refuses a taken address", async () => {
    const { service } = createService({});
    await expect(
      service.create({ name: "Again", slug: "mooncellar", blocks: ["plan"] })
    ).rejects.toThrow("already belongs to another project");
  });
});

describe("ProjectsService.putData", () => {
  it("stores a valid block and records its progress", async () => {
    const { service, data, projects } = createService({});
    const upload = await service.putData(
      "mooncellar",
      "plan",
      `Bearer ${TOKEN}`,
      plan
    );
    expect(upload).toEqual({
      block: "plan",
      updatedAt: CREATED.toISOString(),
      size: Buffer.byteLength(JSON.stringify(plan)),
      done: 1,
      total: 2,
    });
    expect(data.findOneAndUpdate).toHaveBeenCalledWith(
      { slug: "mooncellar", block: "plan" },
      { $set: { body: JSON.stringify(plan) } },
      { upsert: true, new: true }
    );
    expect(projects.updateOne).toHaveBeenLastCalledWith(
      { slug: "mooncellar" },
      {
        $push: {
          uploads: expect.objectContaining({
            block: "plan",
            done: 1,
            total: 2,
          }),
        },
      }
    );
  });

  it("refuses a missing or wrong token without telling which projects exist", async () => {
    const { service } = createService({});
    await expect(
      service.putData("mooncellar", "plan", undefined, plan)
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      service.putData("mooncellar", "plan", "Bearer mcp_wrong", plan)
    ).rejects.toThrow(UnauthorizedException);
    const missing = createService(null);
    await expect(
      missing.service.putData("nothing", "plan", `Bearer ${TOKEN}`, plan)
    ).rejects.toThrow(UnauthorizedException);
  });

  it("refuses a block the project does not have", async () => {
    const { service } = createService({});
    await expect(
      service.putData("mooncellar", "decomp", `Bearer ${TOKEN}`, {})
    ).rejects.toThrow("MoonCellar has no Decompilation block");
  });

  it("refuses an unknown block name", async () => {
    const { service } = createService({});
    await expect(
      service.putData("mooncellar", "wiki", `Bearer ${TOKEN}`, {})
    ).rejects.toThrow(BadRequestException);
  });

  it("validates the body against the block's schema", async () => {
    const { service, data } = createService({});
    await expect(
      service.putData("mooncellar", "plan", `Bearer ${TOKEN}`, {
        sections: [{ id: "H" }],
      })
    ).rejects.toThrow(ZodValidationException);
    expect(data.findOneAndUpdate).not.toHaveBeenCalled();
  });
});

describe("ProjectsService.getData", () => {
  it("says when nothing was uploaded yet", async () => {
    const { service } = createService({});
    await expect(service.getData("mooncellar", "plan")).rejects.toThrow(
      new NotFoundException("MoonCellar has not uploaded its Plan block yet")
    );
  });

  it("returns the stored JSON as it is", async () => {
    const { service, data } = createService({});
    data.findOne.mockReturnValue(chain({ body: '{"sections":[]}' }) as never);
    await expect(service.getData("mooncellar", "plan")).resolves.toBe(
      '{"sections":[]}'
    );
  });
});

describe("ProjectsService.update", () => {
  it("drops the data of a removed block", async () => {
    const { service, data, projects } = createService({
      blocks: ["decomp", "plan"],
    });
    await service.update("mooncellar", { blocks: ["plan"] });
    expect(projects.findOneAndUpdate).toHaveBeenCalledWith(
      { slug: "mooncellar" },
      {
        $set: { name: "MoonCellar", blocks: ["plan"] },
        $pull: { uploads: { block: { $in: ["decomp"] } } },
      },
      { new: true }
    );
    expect(data.deleteMany).toHaveBeenCalledWith({
      slug: "mooncellar",
      block: { $in: ["decomp"] },
    });
  });
});
