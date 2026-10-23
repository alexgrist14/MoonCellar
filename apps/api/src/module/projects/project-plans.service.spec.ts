import {
  nextSectionId,
  nextTaskId,
  toPlanBlock,
} from "./project-plans.service";

const CREATED = new Date("2026-10-23T10:00:00Z");

const task = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  section: id[0],
  title: `Task ${id}`,
  where: null,
  depends: [],
  doneWhen: null,
  size: "S",
  done: false,
  doneAt: null,
  doneBy: null,
  owner: null,
  takenAt: null,
  note: null,
  createdAt: CREATED,
  createdBy: "alice",
  ...extra,
});

describe("toPlanBlock", () => {
  it("is empty without a plan", () => {
    expect(toPlanBlock(null)).toEqual({ version: 0, sections: [] });
  });

  it("derives every state from done, owner and dependencies", () => {
    const block = toPlanBlock({
      version: 4,
      sections: [{ id: "H", title: "Status hub" }],
      tasks: [
        task("H1", { done: true, doneAt: CREATED, doneBy: "alice" }),
        task("H2", { owner: "alexgrist14", takenAt: CREATED, depends: ["H1"] }),
        task("H3", { depends: ["H2"] }),
        task("H4", { depends: ["H1"] }),
      ],
    });
    const [hub] = block.sections;
    expect(block.version).toBe(4);
    expect(hub.tasks.map((item) => [item.id, item.state])).toEqual([
      ["H1", "done"],
      ["H2", "taken"],
      ["H3", "waiting"],
      ["H4", "free"],
    ]);
    expect(hub.tasks[0]).toMatchObject({
      doneAt: CREATED.toISOString(),
      doneBy: "alice",
    });
    expect(hub.tasks[1]).toMatchObject({
      owner: "alexgrist14",
      takenAt: CREATED.toISOString(),
    });
    expect(hub.tasks[2].waitsFor).toEqual(["H2"]);
    expect(hub.tasks[0].owner).toBeUndefined();
  });
});

describe("plan ids", () => {
  it("numbers a task after the highest of its section", () => {
    expect(nextTaskId("H", [{ id: "H1" }, { id: "H9" }, { id: "J12" }])).toBe(
      "H10"
    );
    expect(nextTaskId("Q", [{ id: "H1" }])).toBe("Q1");
  });

  it("takes the first free letter for a section, then two letters", () => {
    expect(nextSectionId([{ id: "A" }, { id: "C" }])).toBe("B");
    const all = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((id) => ({ id }));
    expect(nextSectionId(all)).toBe("AA");
  });
});
