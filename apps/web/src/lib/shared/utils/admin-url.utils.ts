export const ADMIN_TABS = [
  "users",
  "games",
  "comments",
  "conflicts",
  "characters",
  "images",
  "sites",
] as const;

export type TAdminTab = (typeof ADMIN_TABS)[number];

export const ADMIN_TAB_LABELS: Record<TAdminTab, string> = {
  users: "Users",
  games: "Games",
  comments: "Comments",
  conflicts: "Conflicts",
  characters: "Characters",
  images: "Images",
  sites: "Sites",
};

export const ADMIN_HREF = "/admin";

export const getAdminHref = (tab: TAdminTab) => `${ADMIN_HREF}/${tab}`;

export const isAdminTab = (tab?: string | null): tab is TAdminTab =>
  ADMIN_TABS.includes(tab as TAdminTab);

export const setAdminQuery = (
  params: Record<string, string | null>,
  isReplace?: boolean
) => {
  const url = new URL(window.location.href);

  Object.entries(params).forEach(([key, value]) =>
    value === null
      ? url.searchParams.delete(key)
      : url.searchParams.set(key, value)
  );

  isReplace
    ? window.history.replaceState(null, "", url)
    : window.history.pushState(null, "", url);
};
