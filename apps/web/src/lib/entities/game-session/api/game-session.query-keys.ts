export const gameSessionQueryKeys = {
  all: ["game-sessions"] as const,
  list: () => [...gameSessionQueryKeys.all, "list"] as const,
  link: (userCode: string) =>
    [...gameSessionQueryKeys.all, "link", userCode] as const,
};
