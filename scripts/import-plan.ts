import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import {
  type IPlanBlock,
  type IPlanTask,
  PlanBlockSchema,
} from "@mooncellar/schemas";

const DEFAULT_PLAN = join(import.meta.dir, "..", "docs", "plan.md");
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
    const waitsFor = (depends?.match(TASK_ID) ?? []).filter(
      (dep) => !done.has(dep)
    );
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

/** STATUS_HUB_TOKEN, else the file `bun scripts/hub-connect.ts <project>` saved. */
const readToken = (project: string) => {
  if (process.env.STATUS_HUB_TOKEN) return process.env.STATUS_HUB_TOKEN;
  const file = join(homedir(), ".config", "mooncellar", `${project}-hub-token`);
  return existsSync(file) ? readFileSync(file, "utf8").trim() : undefined;
};

const upload = async (plan: IPlanBlock) => {
  const url = process.env.STATUS_HUB_URL ?? "https://api.mooncellar.space";
  const project = process.env.STATUS_HUB_PROJECT ?? "mooncellar";
  const token = readToken(project);
  if (!token) {
    console.log(
      `No token: run bun scripts/hub-connect.ts ${project} or set STATUS_HUB_TOKEN. The plan was checked, nothing was imported`
    );
    return;
  }
  const response = await fetch(`${url}/projects/${project}/plan`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
    },
    body: gzipSync(JSON.stringify(plan)),
  });
  const answer = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `The hub refused the plan (${response.status}): ${answer.message ?? response.statusText}`
    );
  }
  const tasks: IPlanTask[] = (answer as IPlanBlock).sections.flatMap(
    (section) => section.tasks
  );
  console.log(
    `Plan imported: ${tasks.filter((task) => task.state === "done").length} of ${tasks.length} tasks done`
  );
};

if (import.meta.main) {
  const fileIndex = process.argv.indexOf("--file");
  const file = fileIndex > 0 ? process.argv[fileIndex + 1] : DEFAULT_PLAN;
  const plan = parsePlan(readFileSync(file, "utf8"), process.env.GITHUB_SHA);
  const tasks = plan.sections.flatMap((section) => section.tasks);
  console.log(`${tasks.length} tasks in ${plan.sections.length} sections`);
  if (!process.argv.includes("--check")) await upload(plan);
}
