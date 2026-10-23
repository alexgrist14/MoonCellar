import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import {
  type IPlanBlock,
  type IPlanTask,
  PlanBlockSchema,
} from "@mooncellar/schemas";

const PLAN_PATH = join(import.meta.dir, "..", "docs", "plan.md");
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

const upload = async (plan: IPlanBlock) => {
  const token = process.env.STATUS_HUB_TOKEN;
  if (!token) {
    console.log(
      "::warning::STATUS_HUB_TOKEN is not set, the plan was checked but not uploaded"
    );
    return;
  }
  const url = process.env.STATUS_HUB_URL ?? "https://api.mooncellar.space";
  const project = process.env.STATUS_HUB_PROJECT ?? "mooncellar";
  const response = await fetch(`${url}/projects/${project}/data/plan`, {
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
  console.log(`Plan uploaded: ${answer.done} of ${answer.total} tasks done`);
};

if (import.meta.main) {
  const plan = parsePlan(
    readFileSync(PLAN_PATH, "utf8"),
    process.env.GITHUB_SHA
  );
  const tasks = plan.sections.flatMap((section) => section.tasks);
  console.log(`${tasks.length} tasks in ${plan.sections.length} sections`);
  if (!process.argv.includes("--check")) await upload(plan);
}
