export const ratingQueryKeys = {
  all: ["ratings"] as const,
  list: (userId: string) => [...ratingQueryKeys.all, "user", userId] as const,
};
