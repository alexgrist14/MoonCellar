import { describe, expect, it } from "bun:test";
import { parsePlan } from "./import-plan";

const plan = `# Plan

## H. Status hub

| # | Task | Who | Depends | Done when | Size |
|---|---|---|---|---|---|
| H1 ✓ | Hub | sergeyhist | — | Admins see it | L |
| H2 | Uploads | sergeyhist | H1 | Pages follow main | S |
| H3 | Plan in the hub | — | H2 | It updates | S |
| H4 | Digest |  |  |  | S |

## E. Empty section

| # | Task | Who | Depends | Done when | Size |
|---|---|---|---|---|---|
`;

describe("parsePlan", () => {
  const { sections } = parsePlan(plan, "abc1234");
  const [hub] = sections;

  it("keeps only sections with tasks", () => {
    expect(sections.map((section) => section.id)).toEqual(["H"]);
    expect(hub.title).toBe("Status hub");
  });

  it("reads the state of every task", () => {
    expect(hub.tasks.map((task) => [task.id, task.state])).toEqual([
      ["H1", "done"],
      ["H2", "taken"],
      ["H3", "waiting"],
      ["H4", "free"],
    ]);
  });

  it("names the owner and what a task waits for", () => {
    expect(hub.tasks[1]).toMatchObject({
      owner: "sergeyhist",
      doneWhen: "Pages follow main",
      size: "S",
    });
    expect(hub.tasks[2].waitsFor).toEqual(["H2"]);
    expect(hub.tasks[0].owner).toBeUndefined();
  });

  it("reads the real plan", () => {
    const real = Bun.file(new URL("../docs/plan.md", import.meta.url));
    return real
      .text()
      .then((text) =>
        expect(parsePlan(text).sections.length).toBeGreaterThan(0)
      );
  });
});
