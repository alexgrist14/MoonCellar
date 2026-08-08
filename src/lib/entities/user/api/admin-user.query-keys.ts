export const adminUserQueryKeys = {
  all: ["admin", "users"] as const,
  list: () => [...adminUserQueryKeys.all, "list"] as const,
};
