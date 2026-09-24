export const ADMIN_TABS = [
  "users",
  "games",
  "reports",
  "vndb",
  "characters",
  "requests",
] as const;

export type TAdminTab = (typeof ADMIN_TABS)[number];

export const getAdminTabIndex = (tab: string | null) =>
  Math.max(ADMIN_TABS.indexOf(tab as TAdminTab), 0);

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
