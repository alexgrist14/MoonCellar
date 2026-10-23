import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { createServer, ServerResponse } from "node:http";
import { AddressInfo } from "node:net";
import { homedir, hostname, userInfo } from "node:os";
import { dirname, join } from "node:path";
import {
  repositoryProject,
  saveRepositoryProject,
  scriptCommand,
} from "./hub-client";

const usage = () => {
  const self = scriptCommand("hub-connect");
  return `Connect this machine or a CI to a project of the status hub.

  ${self} [<project>] [--name <name>] [--file <path>] [--save]
  ${self} [<project>] --secret <NAME> [--repo <owner/repo>]

Opens the hub in the browser; after "Allow" the token is saved to the file
(default ~/.config/mooncellar/<project>-hub-token) or stored as a GitHub Actions
secret through gh. Without <project>, the one in the repository's
.claude/status-hub.json. A project that does not exist yet is created on the same
page: --title <name> and --blocks plan,decomp suggest its name and blocks.
--save records the project in .claude/status-hub.json of this repository.
--no-open only prints the link.`;
};

const TIMEOUT_MS = 10 * 60 * 1000;

const option = (args: string[], name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const openInBrowser = (url: string) => {
  const [command, ...rest] =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  const child = spawn(command, rest, { stdio: "ignore", detached: true });
  child.on("error", () =>
    console.log("Could not open a browser; open the link above by hand.")
  );
  child.unref();
};

const store = (token: string, args: string[], project: string) => {
  const secret = option(args, "--secret");
  if (secret) {
    const repo = option(args, "--repo");
    const gh = spawnSync(
      "gh",
      ["secret", "set", secret, ...(repo ? ["--repo", repo] : [])],
      { input: token, stdio: ["pipe", "inherit", "inherit"] }
    );
    if (gh.status !== 0)
      throw new Error(`gh could not set the secret ${secret}`);
    return `GitHub secret ${secret}${repo ? ` of ${repo}` : ""}`;
  }
  const file =
    option(args, "--file") ??
    join(homedir(), ".config", "mooncellar", `${project}-hub-token`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, token, { mode: 0o600 });
  chmodSync(file, 0o600);
  return file;
};

const page = (response: ServerResponse, title: string, text: string) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(
    `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font:16px system-ui;background:#191d24;color:#e6e6ea;display:grid;place-items:center;height:100vh;margin:0"><div style="max-width:32rem;text-align:center"><h1>${title}</h1><p>${text}</p></div>`
  );
};

export const cli = async () => {
  const args = process.argv.slice(2);
  const project =
    args[0] && !args[0].startsWith("-") ? args[0] : repositoryProject();
  if (!project) {
    console.log(usage());
    process.exit(2);
  }
  const hub = option(args, "--hub") ?? "https://status.mooncellar.space";
  const api = option(args, "--api") ?? "https://api.mooncellar.space";
  const name =
    option(args, "--name") ??
    (option(args, "--secret") ? "CI" : `${userInfo().username}@${hostname()}`);
  const state = randomBytes(24).toString("base64url");

  let finish: (result: string | Error) => void = () => {};
  const done = new Promise<string | Error>((resolve) => (finish = resolve));

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/callback") {
      response.writeHead(404).end("Not found");
      return;
    }
    const code = url.searchParams.get("code");
    if (url.searchParams.get("state") !== state || !code) {
      page(
        response,
        "Wrong link",
        "This answer does not belong to the waiting command."
      );
      return;
    }
    try {
      const exchange = await fetch(
        `${api}/projects/${project}/tokens/exchange`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );
      const answer = await exchange.json().catch(() => ({}));
      if (!exchange.ok)
        throw new Error(
          answer.message ?? `The hub answered ${exchange.status}`
        );
      const where = store(answer.token, args, project);
      const saved = args.includes("--save")
        ? `\n${saveRepositoryProject(project)}.`
        : "";
      finish(
        `Connected as "${answer.name}". The token is in ${where}.${saved}`
      );
      page(
        response,
        "Connected",
        "The token is saved. You can close this tab."
      );
    } catch (error) {
      finish(error as Error);
      page(response, "Not connected", (error as Error).message);
    }
  });
  await new Promise<void>((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve())
  );
  const { port } = server.address() as AddressInfo;

  const title = option(args, "--title");
  const blocks = option(args, "--blocks");
  const link = `${hub}/connect?${new URLSearchParams({
    project,
    name,
    port: String(port),
    state,
    ...(title && { title }),
    ...(blocks && { blocks }),
  })}`;
  console.log(`Allow "${name}" in the browser:\n  ${link}`);
  if (!args.includes("--no-open")) openInBrowser(link);

  const timer = setTimeout(
    () => finish(new Error("Nobody allowed the connection in 10 minutes")),
    TIMEOUT_MS
  );
  const result = await done;
  clearTimeout(timer);
  setTimeout(() => {
    server.closeAllConnections();
    server.close();
  }, 200);
  if (result instanceof Error) {
    console.error(result.message);
    process.exit(1);
  }
  console.log(result);
};

if (import.meta.main) await cli();
