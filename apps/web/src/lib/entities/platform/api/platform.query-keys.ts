export const platformQueryKeys = {
  all: ["platforms"] as const,
  list: () => [...platformQueryKeys.all, "list"] as const,
};
