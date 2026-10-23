import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

/**
 * Where the status hub is and which project the scripts work on. STATUS_HUB_URL (API),
 * STATUS_HUB_WEB (site) and STATUS_HUB_PROJECT override the defaults.
 */
export const hubSettings = () => ({
  api: (process.env.STATUS_HUB_URL ?? "https://api.mooncellar.space").replace(
    /\/$/,
    ""
  ),
  web: (
    process.env.STATUS_HUB_WEB ?? "https://status.mooncellar.space"
  ).replace(/\/$/, ""),
  project: process.env.STATUS_HUB_PROJECT ?? "mooncellar",
});

export const tokenFile = (project: string) =>
  join(homedir(), ".config", "mooncellar", `${project}-hub-token`);

/** STATUS_HUB_TOKEN, else the file `bun scripts/hub-connect.ts <project>` saved. */
export const readToken = (project: string) => {
  if (process.env.STATUS_HUB_TOKEN) return process.env.STATUS_HUB_TOKEN;
  const file = tokenFile(project);
  return existsSync(file) ? readFileSync(file, "utf8").trim() : undefined;
};

export class HubError extends Error {}

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
  if (!token) {
    throw new HubError(
      `No hub token on this machine: run bun scripts/hub-connect.ts ${project} (or /hub)`
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
        response.status === 401
          ? ` (bun scripts/hub-connect.ts ${project}, or /hub)`
          : ""
      }`
    );
  }
  return answer as T;
};
