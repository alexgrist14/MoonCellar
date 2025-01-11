import { ILogs } from "../types/user.type";

export const removeDuplicateLogs = (logs: ILogs[]) => {
  return logs.reduce<ILogs[]>((acc, curr) => {
    const last = acc[0];
    const lastParent = acc[1];

    if (!acc.length) {
      acc.push(curr);
    } else if (
      lastParent?.action !== "rating" &&
      curr.action !== "rating" &&
      lastParent?.gameId === curr.gameId
    ) {
      acc.splice(1, 1, curr);
    } else if (lastParent?.action === "rating" && curr.action === "rating") {
      acc.splice(1, 1, curr);
    } else if (last.action === "rating" && curr.action !== "rating") {
      acc.splice(0, 0, curr);
    } else if (last.action === "rating" && curr.action === "rating") {
      acc.splice(0, 1, curr);
    } else if (
      last.action !== "rating" &&
      curr.action !== "rating" &&
      last.gameId === curr.gameId
    ) {
      acc.splice(0, 1, curr);
    } else {
      acc.splice(0, 0, curr);
    }

    return acc;
  }, []);
};

export const mergeLogs = (logs: ILogs[]) => {
  return removeDuplicateLogs(logs).reduce<ILogs[]>((prev, curr) => {
    const lastLog = prev[prev.length - 1];

    if (lastLog && lastLog.gameId == curr.gameId) {
      lastLog.action = `${lastLog.action} and ${curr.action}`;
      if (curr.rating) lastLog.rating = curr.rating;
      return prev;
    }

    prev.push({ ...curr });
    return prev;
  }, []);
};
