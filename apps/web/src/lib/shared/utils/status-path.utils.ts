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
  return { project, name, port, state };
};

export const getConnectCallbackUrl = (request: IConnectRequest, code: string) =>
  `http://127.0.0.1:${request.port}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(request.state)}`;
