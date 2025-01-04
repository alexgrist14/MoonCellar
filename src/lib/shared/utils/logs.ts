import { ILogs } from "../types/user.type";

export const removeDuplicateLogs = (logs: ILogs[]) => {
  return logs.reverse().reduce<ILogs[]>((acc, curr) => {
    if (!!acc.length) {
      const last = acc[acc.length - 1];

      ((last.action === "rating" && last.action !== curr.action) ||
        (last.action !== "rating" && last.gameId != curr.gameId)) &&
        acc.push(curr);
    } else {
      acc.push(curr);
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
