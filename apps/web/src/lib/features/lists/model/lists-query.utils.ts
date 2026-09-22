import {
  CUSTOM_LISTS_PAGE_SIZE,
  CustomListsGamesModeSchema,
  CustomListsOrderSchema,
  CustomListsSortSchema,
  CustomListsUpdatedSchema,
  IGetCustomListsRequest,
} from "@mooncellar/schemas";

type IQuerySource = { get: (key: string) => string | null };

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

const readNumber = (value: string | null) => {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : undefined;
};

export const parseListsQuery = (
  query: IQuerySource
): IGetCustomListsRequest => {
  const search = query.get("search")?.trim();
  const author = query.get("author")?.trim();
  const games = (query.get("games") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => OBJECT_ID_PATTERN.test(id))
    .slice(0, 20);
  const gamesMode = CustomListsGamesModeSchema.safeParse(
    query.get("gamesMode")
  );
  const updated = CustomListsUpdatedSchema.safeParse(query.get("updated"));
  const sortBy = CustomListsSortSchema.safeParse(query.get("sortBy"));
  const sortOrder = CustomListsOrderSchema.safeParse(query.get("sortOrder"));
  const minGames = readNumber(query.get("minGames"));

  return {
    ...(search ? { search: search.slice(0, 100) } : {}),
    ...(author ? { author: author.slice(0, 15) } : {}),
    ...(games.length ? { games } : {}),
    ...(games.length && gamesMode.success && gamesMode.data === "all"
      ? { gamesMode: "all" as const }
      : {}),
    ...(minGames && minGames > 1 ? { minGames } : {}),
    ...(updated.success ? { updated: updated.data } : {}),
    ...(sortBy.success && sortBy.data !== "popular"
      ? { sortBy: sortBy.data }
      : {}),
    ...(sortOrder.success && sortOrder.data === "asc"
      ? { sortOrder: "asc" as const }
      : {}),
    page: readNumber(query.get("page")) ?? 1,
    take: CUSTOM_LISTS_PAGE_SIZE,
  };
};

export const buildListsQuery = (params: IGetCustomListsRequest) => {
  const query = new URLSearchParams();
  const games = Array.isArray(params.games)
    ? params.games
    : params.games
      ? [params.games]
      : [];

  params.search?.trim() && query.set("search", params.search.trim());
  params.author?.trim() && query.set("author", params.author.trim());
  games.length && query.set("games", games.join(","));
  games.length && params.gamesMode === "all" && query.set("gamesMode", "all");
  !!params.minGames &&
    Number(params.minGames) > 1 &&
    query.set("minGames", String(params.minGames));
  params.updated && query.set("updated", params.updated);
  params.sortBy &&
    params.sortBy !== "popular" &&
    query.set("sortBy", params.sortBy);
  params.sortOrder === "asc" && query.set("sortOrder", "asc");
  !!params.page &&
    Number(params.page) > 1 &&
    query.set("page", String(params.page));

  return query.toString();
};

export const pushListsQuery = (params: IGetCustomListsRequest) => {
  const query = buildListsQuery(params);

  window.history.pushState(null, "", `/lists${query ? `?${query}` : ""}`);
};

export const getListsGameIds = (params: IGetCustomListsRequest) =>
  Array.isArray(params.games)
    ? params.games
    : params.games
      ? [params.games]
      : [];

export const hasListsFilters = (params: IGetCustomListsRequest) =>
  !!params.search ||
  !!params.author ||
  !!getListsGameIds(params).length ||
  !!params.minGames ||
  !!params.updated;
