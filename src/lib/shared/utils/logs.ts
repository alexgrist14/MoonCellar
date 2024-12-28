import { ILogs } from "../types/user.type";

export const removeDuplicateLogs = (logs: ILogs[]) => {
  return logs.reduce<ILogs[]>((acc, curr) => {
    !acc.some(
      (item) =>
        (item.action === "rating" && item.action === curr.action) ||
        (item.action !== "rating" && item.gameId === curr.gameId)) && acc.push(curr)

    return acc;
  }, []);
};

export const mergeLogs = (logs: ILogs[]) => {
  return removeDuplicateLogs(logs).reduce<ILogs[]>((prev, curr) => {
    const existed = prev.find((item) => item.gameId === curr.gameId);

    if (!!existed) {
      existed.action = `${existed.action} and ${curr.action}`;
      if (curr.rating) existed.rating = curr.rating;
      return prev;
    } else {
      prev.push(curr);
      
    }
    return prev;
  }, []);
};
