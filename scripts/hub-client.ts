import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";

export const PROJECT_FILE = join(".claude", "status-hub.json");

export const scriptCommand = (script: string) => {
  const self = process.argv[1] ?? "";
  const near = relative(process.cwd(), dirname(self)) || ".";
  const dir = near.startsWith("..") ? dirname(self) : near;
  const runtime = process.versions.bun ? "bun" : "node";
  return `${runtime} ${join(dir, `${script}${extname(self) || ".ts"}`)}`;
};

export const findProjectFile = (from = process.cwd()) => {
  for (let dir = resolve(from); ; dir = dirname(dir)) {
    const file = join(dir, PROJECT_FILE);
    if (existsSync(file)) return file;
    if (dirname(dir) === dir) return undefined;
  }
};

export const repositoryProject = () => {
  const file = findProjectFile();
  if (!file) return undefined;
  try {
    const { project } = JSON.parse(readFileSync(file, "utf8"));
    return typeof project === "string" && project ? project : undefined;
  } catch {
    return undefined;
  }
};

export const saveRepositoryProject = (project: string) => {
  const current = repositoryProject();
  if (current) {
    return current === project
      ? `This repository already belongs to ${project}`
      : `This repository belongs to ${current} (${findProjectFile()}), left as it is`;
  }
  let root = process.cwd();
  try {
    root = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {}
  const file = join(root, PROJECT_FILE);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ project }, null, 2)}\n`);
  return `This repository now belongs to ${project}: ${file}`;
};

export class HubError extends Error {}

/**
 * Where the status hub is and which project the scripts work on. STATUS_HUB_URL (API) and
 * STATUS_HUB_WEB (site) override the defaults; the project is STATUS_HUB_PROJECT, else the one
 * in the repository's `.claude/status-hub.json`.
 */
export const hubSettings = () => {
  const project = process.env.STATUS_HUB_PROJECT ?? repositoryProject();
  if (!project) {
    throw new HubError(
      `This repository has no project in the status hub (${PROJECT_FILE}): run ${scriptCommand("hub-connect")} <project> --save, or /hub-init`
    );
  }
  return {
    api: (process.env.STATUS_HUB_URL ?? "https://api.mooncellar.space").replace(
      /\/$/,
      ""
    ),
    web: (
      process.env.STATUS_HUB_WEB ?? "https://status.mooncellar.space"
    ).replace(/\/$/, ""),
    project,
  };
};

export const tokenFile = (project: string) =>
  join(homedir(), ".config", "mooncellar", `${project}-hub-token`);

/** STATUS_HUB_TOKEN, else the file the connect command saved. */
export const readToken = (project: string) => {
  if (process.env.STATUS_HUB_TOKEN) return process.env.STATUS_HUB_TOKEN;
  const file = tokenFile(project);
  return existsSync(file) ? readFileSync(file, "utf8").trim() : undefined;
};

/**
 * A request to `/projects/<project><path>` with the machine's token; the answer is parsed JSON.
 * Throws HubError with the API's message, or with how to connect when there is no token.
 */
export const hubRequest = async <T>(
  method: string,
  path: string,
  body?: unknown,
  { gzip = false }: { gzip?: boolean } = {}
): Promise<T> => {
  const { api, project } = hubSettings();
  const token = readToken(project);
  const connect = `${scriptCommand("hub-connect")} ${project}`;
  if (!token) {
    throw new HubError(
      `No hub token on this machine: run ${connect} (or /hub)`
    );
  }
  const json = body === undefined ? undefined : JSON.stringify(body);
  let response: Response;
  try {
    response = await fetch(`${api}/projects/${project}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(json !== undefined && { "Content-Type": "application/json" }),
        ...(gzip && { "Content-Encoding": "gzip" }),
      },
      body: json === undefined ? undefined : gzip ? gzipSync(json) : json,
    });
  } catch (error) {
    throw new HubError(`The hub is not reachable: ${(error as Error).message}`);
  }
  const text = await response.text();
  const answer = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    const message = answer?.message ?? response.statusText;
    throw new HubError(
      `The hub answered ${response.status}: ${message}${
        response.status === 401 ? ` (${connect}, or /hub)` : ""
      }`
    );
  }
  return answer as T;
};
