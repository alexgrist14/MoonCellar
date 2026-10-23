import { IProjectBlock, PROJECT_BLOCKS } from "@mooncellar/schemas";

export const STATUS_SIGN_IN_PATH = "/login";

export const isSafeStatusPath = (
  path: string | null | undefined
): path is string =>
  !!path &&
  path.startsWith("/") &&
  !path.startsWith("//") &&
  !path.startsWith("/\\");

export const getStatusSignInPath = (from: string | null) =>
  isSafeStatusPath(from) && from !== "/" && from !== STATUS_SIGN_IN_PATH
    ? `${STATUS_SIGN_IN_PATH}?next=${encodeURIComponent(from)}`
    : STATUS_SIGN_IN_PATH;
export interface IConnectRequest {
  project: string;
  name: string;
  port: number;
  state: string;
  /** What to call the project if it does not exist yet (the command's suggestion). */
  title?: string;
  /** Its blocks if it does not exist yet, from `blocks=decomp,plan`. */
  blocks?: IProjectBlock[];
}

const STATE = /^[A-Za-z0-9_-]{16,128}$/;

export const readConnectRequest = (
  params: Pick<URLSearchParams, "get">
): IConnectRequest | null => {
  const project = params.get("project") ?? "";
  const name = params.get("name") ?? "";
  const state = params.get("state") ?? "";
  const port = Number(params.get("port"));
  if (!project || !name || !STATE.test(state)) return null;
  if (!Number.isInteger(port) || port < 1024 || port > 65535) return null;
  const title = params.get("title")?.trim().slice(0, 100) || undefined;
  const blocks = (params.get("blocks") ?? "")
    .split(",")
    .filter((block): block is IProjectBlock =>
      PROJECT_BLOCKS.includes(block as IProjectBlock)
    );
  return {
    project,
    name,
    port,
    state,
    ...(title && { title }),
    ...(blocks.length && { blocks: [...new Set(blocks)] }),
  };
};

export const getConnectCallbackUrl = (request: IConnectRequest, code: string) =>
  `http://127.0.0.1:${request.port}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(request.state)}`;
