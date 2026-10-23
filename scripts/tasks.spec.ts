import { describe, expect, it } from "bun:test";
import type { IPlanBlock } from "@mooncellar/schemas";
import { formatPlan, option, stateLabel, taskIds } from "./tasks";

const plan: IPlanBlock = {
  sections: [
    {
      id: "H",
      title: "Status hub",
      tasks: [
        { id: "H1", title: "Hub", state: "done", size: "L" },
        { id: "H2", title: "Uploads", state: "taken", owner: "alice" },
        { id: "H3", title: "Plan", state: "waiting", waitsFor: ["H2"] },
        { id: "H4", title: "Digest", state: "free", size: "S" },
      ],
    },
    {
      id: "I",
      title: "Done section",
      tasks: [{ id: "I1", title: "Old", state: "done" }],
    },
  ],
};

describe("tasks", () => {
  it("reads options and task ids", () => {
    const args = ["take", "H2", "--note", "first pass", "--force"];
    expect(option(args, "--note")).toBe("first pass");
    expect(option(args, "--as")).toBeUndefined();
    expect(taskIds("h1, H2 h3")).toEqual(["H1", "H2", "H3"]);
    expect(taskIds(undefined)).toEqual([]);
  });

  it("names the state of a task", () => {
    const [done, taken, waiting, free] = plan.sections[0].tasks;
    expect(stateLabel(done)).toBe("done");
    expect(stateLabel(taken)).toBe("led by alice");
    expect(stateLabel(waiting)).toBe("waits for H2");
    expect(stateLabel(free)).toBe("free");
  });

  it("lists every task by section, or only free ones", () => {
    const all = formatPlan(plan);
    expect(all).toContain("H. Status hub");
    expect(all).toContain("I. Done section");
    expect(
      all.split("\n").filter((line) => line.startsWith("  "))
    ).toHaveLength(5);

    const free = formatPlan(plan, true);
    expect(free).toContain("H4");
    expect(free).not.toContain("H1");
    expect(free).not.toContain("I. Done section");
  });
});
