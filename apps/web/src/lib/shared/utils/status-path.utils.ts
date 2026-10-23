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
