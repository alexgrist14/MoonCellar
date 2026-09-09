import { IGameResponse } from "../lib/schemas/games.schema";

export interface IGameLink {
  url: string;
  host: string;
  isOfficial: boolean;
}

const communityHosts = [
  "amazon.com",
  "apple.com",
  "bsky.app",
  "discord.com",
  "discord.gg",
  "epicgames.com",
  "facebook.com",
  "fandom.com",
  "gog.com",
  "instagram.com",
  "itch.io",
  "microsoft.com",
  "nintendo.com",
  "playstation.com",
  "reddit.com",
  "steampowered.com",
  "twitch.tv",
  "twitter.com",
  "wikia.com",
  "wikipedia.org",
  "x.com",
  "xbox.com",
  "youtube.com",
];

export const getLinkHost = (url?: string | null): string | null => {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

export const getGameExternalPages = (game: IGameResponse) =>
  (game.externalPages || []).filter((page) => !!page.url);

export const getGameLinks = (game: IGameResponse): IGameLink[] => {
  const takenHosts = new Set(
    (game.externalPages || [])
      .map((page) => getLinkHost(page.url))
      .filter((host): host is string => !!host)
  );

  const seenHosts = new Set<string>();
  const links: IGameLink[] = [];

  for (const url of game.websites || []) {
    const host = getLinkHost(url);

    if (!host || takenHosts.has(host) || seenHosts.has(host)) {
      continue;
    }

    seenHosts.add(host);

    links.push({
      url,
      host,
      isOfficial: !communityHosts.some(
        (known) => host === known || host.endsWith(`.${known}`)
      ),
    });
  }

  const officialIndex = links.findIndex((link) => link.isOfficial);

  const ordered =
    officialIndex > 0
      ? [links[officialIndex], ...links.filter((_, i) => i !== officialIndex)]
      : links;

  return ordered.map((link, i) => ({
    ...link,
    isOfficial: i === 0 && link.isOfficial,
  }));
};
