import { execFileSync } from "node:child_process";
import type { IPlanBlock, IPlanEvent, IPlanTask } from "@mooncellar/schemas";
import { HubError, hubRequest, hubSettings } from "./hub-client";

const USAGE = `Tasks of a project's plan in the status hub (the plan lives there, not in the repository).

  bun scripts/tasks.ts list [--free] [--json]      tasks and their state
  bun scripts/tasks.ts show <id>                   one task with its history
  bun scripts/tasks.ts take <id> [--note <text>]   lead a task
  bun scripts/tasks.ts release <id>                let it go
  bun scripts/tasks.ts done <id>                   mark it done
  bun scripts/tasks.ts reopen <id>                 take the mark back
  bun scripts/tasks.ts add <section> "<task>" [--where …] [--depends H1,H2] [--done-when …] [--size S|M|L]
  bun scripts/tasks.ts edit <id> [--title …] [--where …] [--depends …] [--done-when …] [--size …]
  bun scripts/tasks.ts section "<title>" [--id X]  a new section (first free letter unless given)
  bun scripts/tasks.ts url                         the project's page in the hub

Actions are made for --as <name>, STATUS_HUB_AS or git user.name in lower case. Taking,
releasing or finishing a task someone else leads needs --force: share work through the hub.
The token is the one bun scripts/hub-connect.ts <project> saved (or STATUS_HUB_TOKEN);
STATUS_HUB_PROJECT picks another project (default mooncellar).`;

const ACTIONS = ["take", "release", "done", "reopen"] as const;
type IAction = (typeof ACTIONS)[number];

const PAST: Record<string, string> = {
  take: "took",
  release: "released",
  done: "finished",
  reopen: "reopened",
  create: "added",
  edit: "edited",
  delete: "deleted",
  import: "imported the plan",
};

export const option = (args: string[], name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

export const taskIds = (value?: string) =>
  (value ?? "")
    .split(/[\s,]+/)
    .map((id) => id.trim().toUpperCase())
    .filter(Boolean);

export const stateLabel = (task: IPlanTask) => {
  if (task.state === "done") return "done";
  if (task.state === "taken") return `led by ${task.owner ?? "?"}`;
  if (task.state === "waiting")
    return `waits for ${(task.waitsFor ?? []).join(", ")}`;
  return "free";
};

/** The plan as text: a header per section, a line per task (filtered by `free`). */
export const formatPlan = (plan: IPlanBlock, free = false) => {
  const lines: string[] = [];
  for (const section of plan.sections) {
    const tasks = section.tasks.filter(
      (task) => !free || task.state === "free"
    );
    if (!tasks.length) continue;
    lines.push("", `${section.id}. ${section.title}`);
    for (const task of tasks) {
      const title =
        task.title.length > 90 ? `${task.title.slice(0, 89)}…` : task.title;
      lines.push(
        `  ${task.id.padEnd(4)} ${stateLabel(task).padEnd(22)} ${(task.size ?? "").padEnd(2)} ${title}`
      );
    }
  }
  return lines.join("\n");
};

export const me = () => {
  if (process.env.STATUS_HUB_AS) return process.env.STATUS_HUB_AS;
  try {
    const name = execFileSync("git", ["config", "user.name"], {
      encoding: "utf8",
    }).trim();
    return name.toLowerCase().replace(/[^a-z0-9-]/g, "-") || "unknown";
  } catch {
    return "unknown";
  }
};

const findTask = (plan: IPlanBlock, id: string) => {
  for (const section of plan.sections) {
    const task = section.tasks.find((item) => item.id === id.toUpperCase());
    if (task) return { task, section };
  }
  throw new HubError(
    `No task ${id.toUpperCase()} in the plan (bun scripts/tasks.ts list)`
  );
};

const getPlan = () => hubRequest<IPlanBlock>("GET", "/plan");

const run = async (args: string[]): Promise<number> => {
  const [command, ...rest] = args;
  const id = rest[0];

  if (command === "url") {
    const { web, project } = hubSettings();
    console.log(`${web}/${project}`);
    return 0;
  }
  if (command === "list") {
    const plan = await getPlan();
    if (rest.includes("--json")) {
      console.log(JSON.stringify(plan));
      return 0;
    }
    console.log(formatPlan(plan, rest.includes("--free")) || "No tasks.");
    return 0;
  }
  if (command === "show" && id) {
    const { task, section } = findTask(await getPlan(), id);
    console.log(`${task.id} — ${task.title}`);
    console.log(`Section: ${section.id}. ${section.title}`);
    console.log(`Where: ${task.where ?? "—"}`);
    console.log(`Depends on: ${(task.depends ?? []).join(", ") || "—"}`);
    console.log(`Done when: ${task.doneWhen ?? "—"}`);
    console.log(`Size: ${task.size ?? "—"}`);
    console.log(
      `State: ${stateLabel(task)}${task.note && task.state === "taken" ? ` (${task.note})` : ""}`
    );
    const events = await hubRequest<IPlanEvent[]>(
      "GET",
      `/plan/events?task=${encodeURIComponent(task.id)}`
    ).catch(() => []);
    for (const event of events.slice(0, 5)) {
      const text = event.text ? ` — ${event.text}` : "";
      console.log(
        `  ${event.at.slice(0, 16).replace("T", " ")} UTC ${event.by} ${PAST[event.action] ?? event.action}${text}`
      );
    }
    return 0;
  }
  if (ACTIONS.includes(command as IAction) && id) {
    const { task } = findTask(await getPlan(), id);
    const who = option(rest, "--as") ?? me();
    const note = option(rest, "--note");
    await hubRequest<IPlanBlock>(
      "POST",
      `/plan/tasks/${encodeURIComponent(task.id)}/${command}`,
      {
        as: who,
        ...(note && { note }),
        ...(rest.includes("--force") && { force: true }),
      }
    );
    console.log(`${task.id}: ${PAST[command]} (${who})`);
    return 0;
  }
  if (command === "add" && rest.length >= 2) {
    const [section, title] = rest;
    const before = new Set(
      (await getPlan()).sections.flatMap((item) =>
        item.tasks.map((task) => task.id)
      )
    );
    const depends = taskIds(option(rest, "--depends"));
    const plan = await hubRequest<IPlanBlock>("POST", "/plan/tasks", {
      section: section.toUpperCase(),
      title,
      ...(option(rest, "--where") && { where: option(rest, "--where") }),
      ...(depends.length && { depends }),
      ...(option(rest, "--done-when") && {
        doneWhen: option(rest, "--done-when"),
      }),
      ...(option(rest, "--size") && { size: option(rest, "--size") }),
    });
    const added = plan.sections
      .flatMap((item) => item.tasks)
      .filter((task) => !before.has(task.id))
      .map((task) => task.id);
    console.log(
      `Added ${added.join(", ")} to section ${section.toUpperCase()}`
    );
    return 0;
  }
  if (command === "edit" && id) {
    const { task } = findTask(await getPlan(), id);
    const fields: Record<string, unknown> = {};
    for (const [key, flag] of [
      ["title", "--title"],
      ["where", "--where"],
      ["doneWhen", "--done-when"],
      ["size", "--size"],
    ]) {
      const value = option(rest, flag);
      if (value !== undefined) fields[key] = value;
    }
    if (rest.includes("--depends"))
      fields.depends = taskIds(option(rest, "--depends"));
    if (!Object.keys(fields).length) {
      console.log(
        "Nothing to change: --title, --where, --depends, --done-when, --size"
      );
      return 2;
    }
    await hubRequest(
      "PATCH",
      `/plan/tasks/${encodeURIComponent(task.id)}`,
      fields
    );
    console.log(`${task.id}: edited`);
    return 0;
  }
  if (command === "section" && id) {
    const before = new Set((await getPlan()).sections.map((item) => item.id));
    const sectionId = option(rest, "--id");
    const plan = await hubRequest<IPlanBlock>("POST", "/plan/sections", {
      title: id,
      ...(sectionId && { id: sectionId.toUpperCase() }),
    });
    const added = plan.sections.find((item) => !before.has(item.id));
    console.log(`Added section ${added?.id ?? "?"}: ${id}`);
    return 0;
  }
  console.log(USAGE);
  return 2;
};

if (import.meta.main) {
  try {
    process.exit(await run(process.argv.slice(2)));
  } catch (error) {
    if (!(error instanceof HubError)) throw error;
    console.error(error.message);
    process.exit(1);
  }
}
