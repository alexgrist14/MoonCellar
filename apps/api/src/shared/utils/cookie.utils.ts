export const getCookie = (header: string | undefined, name: string) => {
  const prefix = `${name}=`;
  const pair = header
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!pair) return undefined;

  try {
    return decodeURIComponent(pair.slice(prefix.length));
  } catch {
    return undefined;
  }
};
