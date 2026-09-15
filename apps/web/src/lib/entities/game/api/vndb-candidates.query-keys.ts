export const vndbCandidateQueryKeys = {
  all: ["vndb-candidates"] as const,
  summary: () => [...vndbCandidateQueryKeys.all, "summary"] as const,
  nextAll: () => [...vndbCandidateQueryKeys.all, "next"] as const,
  next: (after: string | null) =>
    [...vndbCandidateQueryKeys.nextAll(), after] as const,
};
