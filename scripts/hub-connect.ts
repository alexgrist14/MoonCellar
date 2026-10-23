import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir, hostname, userInfo } from "node:os";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

const USAGE = `Connect this machine or a CI to a project of the status hub.

  bun scripts/hub-connect.ts <project> [--name <name>] [--file <path>]
  bun scripts/hub-connect.ts <project> --secret <NAME> [--repo <owner/repo>]

Opens the hub in the browser; after "Allow" the token is saved to the file
(default ~/.config/mooncellar/<project>-hub-token) or stored as a GitHub Actions
secret through gh. --no-open only prints the link.`;

const TIMEOUT_MS = 10 * 60 * 1000;

const option = (args: string[], name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const openInBrowser = (url: string) => {
  const command =
    process.platform === "darwin"
      ? ["open", url]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", url]
        : ["xdg-open", url];
  try {
    Bun.spawn(command, { stdout: "ignore", stderr: "ignore" });
  } catch {
    console.log("Could not open a browser; open the link above by hand.");
  }
};

const store = async (token: string, args: string[], project: string) => {
  const secret = option(args, "--secret");
  if (secret) {
    const repo = option(args, "--repo");
    const gh = Bun.spawn(
      ["gh", "secret", "set", secret, ...(repo ? ["--repo", repo] : [])],
      {
        stdin: new TextEncoder().encode(token),
        stdout: "inherit",
        stderr: "inherit",
      }
    );
    if ((await gh.exited) !== 0)
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

const page = (title: string, text: string) =>
  new Response(
    `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="font:16px system-ui;background:#191d24;color:#e6e6ea;display:grid;place-items:center;height:100vh;margin:0"><div style="max-width:32rem;text-align:center"><h1>${title}</h1><p>${text}</p></div>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

const main = async () => {
  const args = process.argv.slice(2);
  const project = args[0];
  if (!project || project.startsWith("-")) {
    console.log(USAGE);
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

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      if (url.pathname !== "/callback")
        return new Response("Not found", { status: 404 });
      const code = url.searchParams.get("code");
      if (url.searchParams.get("state") !== state || !code) {
        return page(
          "Wrong link",
          "This answer does not belong to the waiting command."
        );
      }
      try {
        const response = await fetch(
          `${api}/projects/${project}/tokens/exchange`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          }
        );
        const answer = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(
            answer.message ?? `The hub answered ${response.status}`
          );
        const where = await store(answer.token, args, project);
        finish(`Connected as "${answer.name}". The token is in ${where}.`);
        return page("Connected", "The token is saved. You can close this tab.");
      } catch (error) {
        finish(error as Error);
        return page("Not connected", (error as Error).message);
      }
    },
  });

  const link = `${hub}/connect?${new URLSearchParams({
    project,
    name,
    port: String(server.port),
    state,
  })}`;
  console.log(`Allow "${name}" in the browser:\n  ${link}`);
  if (!args.includes("--no-open")) openInBrowser(link);

  const timer = setTimeout(
    () => finish(new Error("Nobody allowed the connection in 10 minutes")),
    TIMEOUT_MS
  );
  const result = await done;
  clearTimeout(timer);
  setTimeout(() => server.stop(true), 200);
  if (result instanceof Error) {
    console.error(result.message);
    process.exit(1);
  }
  console.log(result);
};

if (import.meta.main) await main();
