import { IGetVndbCandidatesParams } from "@mooncellar/schemas";

export const vndbCandidateQueryKeys = {
  all: ["vndb-candidates"] as const,
  summary: () => [...vndbCandidateQueryKeys.all, "summary"] as const,
  item: (vnId: string) => [...vndbCandidateQueryKeys.all, "item", vnId] as const,
  listAll: () => [...vndbCandidateQueryKeys.all, "list"] as const,
  list: (params: IGetVndbCandidatesParams) =>
    [...vndbCandidateQueryKeys.listAll(), params] as const,
};
