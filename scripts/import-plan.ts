import { readFileSync } from "node:fs";
import {
  type IPlanBlock,
  type IPlanTask,
  PlanBlockSchema,
} from "@mooncellar/schemas";
import {
  HubError,
  hubRequest,
  hubSettings,
  readToken,
  scriptCommand,
} from "./hub-client";

const USAGE = `Import a markdown plan once into a project's empty plan in the status hub.

  bun scripts/import-plan.ts --file <plan.md> [--check]

A section is "## X. Title", a task a table row "| id | task | who | depends | done when | size |"
with ✓ after a done task's id. --check only parses. The project is the one in the repository's
.claude/status-hub.json (or STATUS_HUB_PROJECT); the token is the one bun scripts/hub-connect.ts
saved (or STATUS_HUB_TOKEN).`;
const SECTION = /^##\s+([A-Z])\.\s+(.+?)\s*$/;
const ROW = /^\|\s*([A-Z]\d+)(\s*✓)?\s*\|(.*)\|\s*$/;
const TASK_ID = /\b[A-Z]\d+\b/g;
const EMPTY = new Set(["", "—", "-"]);

const cell = (value: string | undefined) => {
  const text = (value ?? "").trim();
  return EMPTY.has(text) ? undefined : text;
};

export const parsePlan = (markdown: string, commit?: string): IPlanBlock => {
  const sections: IPlanBlock["sections"] = [];
  const rows: {
    section: number;
    id: string;
    done: boolean;
    cells: string[];
  }[] = [];

  for (const line of markdown.split("\n")) {
    const section = SECTION.exec(line);
    if (section) {
      sections.push({ id: section[1], title: section[2], tasks: [] });
      continue;
    }
    const row = ROW.exec(line);
    if (row && sections.length) {
      rows.push({
        section: sections.length - 1,
        id: row[1],
        done: !!row[2],
        cells: row[3].split("|"),
      });
    }
  }

  const done = new Set(rows.filter((row) => row.done).map((row) => row.id));
  for (const { section, id, done: isDone, cells } of rows) {
    const [title, who, depends, doneWhen, size] = cells.map(cell);
    const dependsOn = depends?.match(TASK_ID) ?? [];
    const waitsFor = dependsOn.filter((dep) => !done.has(dep));
    const task: IPlanTask = {
      id,
      title: title ?? id,
      state: isDone
        ? "done"
        : who
          ? "taken"
          : waitsFor.length
            ? "waiting"
            : "free",
      ...(who && !isDone && { owner: who }),
      ...(dependsOn.length && { depends: dependsOn }),
      ...(!isDone && waitsFor.length && { waitsFor }),
      ...(doneWhen && { doneWhen }),
      ...(size && { size }),
    };
    sections[section].tasks.push(task);
  }

  return PlanBlockSchema.parse({
    ...(commit && { commit }),
    sections: sections.filter((section) => section.tasks.length),
  });
};

const upload = async (plan: IPlanBlock) => {
  const { project } = hubSettings();
  if (!readToken(project)) {
    console.log(
      `No token: run ${scriptCommand("hub-connect")} ${project} or set STATUS_HUB_TOKEN. The plan was checked, nothing was imported`
    );
    return;
  }
  const answer = await hubRequest<IPlanBlock>("PUT", "/plan", plan, {
    gzip: true,
  });
  const tasks: IPlanTask[] = answer.sections.flatMap(
    (section) => section.tasks
  );
  console.log(
    `Plan imported: ${tasks.filter((task) => task.state === "done").length} of ${tasks.length} tasks done`
  );
};

if (import.meta.main) {
  const fileIndex = process.argv.indexOf("--file");
  const file = fileIndex > 0 ? process.argv[fileIndex + 1] : undefined;
  if (!file) {
    console.log(USAGE);
    process.exit(2);
  }
  const plan = parsePlan(readFileSync(file, "utf8"), process.env.GITHUB_SHA);
  const tasks = plan.sections.flatMap((section) => section.tasks);
  console.log(`${tasks.length} tasks in ${plan.sections.length} sections`);
  if (!process.argv.includes("--check")) {
    try {
      await upload(plan);
    } catch (error) {
      if (!(error instanceof HubError)) throw error;
      console.error(error.message);
      process.exit(1);
    }
  }
}
