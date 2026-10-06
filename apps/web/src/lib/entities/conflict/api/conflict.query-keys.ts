import { IConflictSource, IGetConflictsParams } from "@mooncellar/schemas";

export const conflictQueryKeys = {
  all: ["conflicts"] as const,
  summaryAll: () => [...conflictQueryKeys.all, "summary"] as const,
  summary: (source?: IConflictSource) =>
    [...conflictQueryKeys.summaryAll(), source ?? "all"] as const,
  item: (source: IConflictSource, externalId: string) =>
    [...conflictQueryKeys.all, "item", source, externalId] as const,
  byGame: (gameId: string) =>
    [...conflictQueryKeys.all, "by-game", gameId] as const,
  listAll: () => [...conflictQueryKeys.all, "list"] as const,
  list: (params: IGetConflictsParams) =>
    [...conflictQueryKeys.listAll(), params] as const,
};
