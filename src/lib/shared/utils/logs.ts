import { ILogs } from "../types/user.type";

export const removeDuplicateLogs = (logs: ILogs[]) => {
  return logs.reduce<ILogs[]>((acc, curr) => {
    const lastLog = acc[acc.length - 1];

    if (
      lastLog &&
      lastLog.gameId === curr.gameId &&
      ((lastLog.action !== "rating" && curr.action !== "rating") ||
        (lastLog.rating && curr.rating))
    ) {
      acc.pop();
    }

    acc.push(curr);
    return acc;
  }, []);
};

export const mergeLogs = (logs: ILogs[]) => {
  return logs.reduce<ILogs[]>((prev, curr) => {
    const lastLog = prev[prev.length - 1];

    if (lastLog && lastLog.gameId === curr.gameId) {
      lastLog.action = `${lastLog.action} and ${curr.action}`;
      if (curr.rating) lastLog.rating = curr.rating;
      return prev;
    }
    prev.push({ ...curr });
    return prev;
  }, []);
};
