export interface IEmoji {
  emoji: string;
  label: string;
  keywords: string[];
}

export interface IEmojiGroup {
  key: number;
  label: string;
  icon: string;
  emojis: IEmoji[];
}

interface IEmojibaseEntry {
  emoji: string;
  label: string;
  tags?: string[];
  emoticon?: string | string[];
  group?: number;
  order?: number;
  version: number;
}

interface IEmojiSupport {
  maxVersion: number;
  hasFlags: boolean;
}

const MAX_EMOJI_VERSION = 15;
const BASELINE_EMOJI_VERSION = 5;
const FLAG_PROBE = "🇯🇵";
const FLAG_SEQUENCE = /[\u{1F1E6}-\u{1F1FF}]|\u{1F3F4}\u{E0067}/u;

const PROBE_SIZE = 32;
const PROBE_FONT_SIZE = 24;
const INK_ALPHA = 64;
const CHANNEL_SHIFT = 64;
const MIN_INK_PIXELS = 16;
const MAX_TINTED_SHARE = 0.1;

const VERSION_PROBES: [version: number, emoji: string][] = [
  [15, "🫨"],
  [14, "🫠"],
  [13, "🥲"],
  [12, "🥱"],
  [11, "🥰"],
];

export const EMOJI_GROUPS: Omit<IEmojiGroup, "emojis">[] = [
  { key: 0, label: "Smileys & emotion", icon: "😀" },
  { key: 1, label: "People & body", icon: "👋" },
  { key: 3, label: "Animals & nature", icon: "🐻" },
  { key: 4, label: "Food & drink", icon: "🍔" },
  { key: 5, label: "Travel & places", icon: "🚗" },
  { key: 6, label: "Activities", icon: "🎮" },
  { key: 7, label: "Objects", icon: "💡" },
  { key: 8, label: "Symbols", icon: "❤️" },
  { key: 9, label: "Flags", icon: "🏁" },
];

const drawProbe = (
  context: CanvasRenderingContext2D,
  emoji: string,
  color: string
) => {
  context.clearRect(0, 0, PROBE_SIZE, PROBE_SIZE);
  context.fillStyle = color;
  context.fillText(emoji, 0, 0);

  return context.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE).data;
};

const isColorGlyphRendered = (
  context: CanvasRenderingContext2D,
  emoji: string
) => {
  const red = drawProbe(context, emoji, "#f00");
  const blue = drawProbe(context, emoji, "#00f");

  let inkPixels = 0;
  let tintedPixels = 0;

  for (let index = 0; index < red.length; index += 4) {
    if (red[index + 3] < INK_ALPHA && blue[index + 3] < INK_ALPHA) continue;

    inkPixels += 1;

    if (
      Math.abs(red[index] - blue[index]) > CHANNEL_SHIFT ||
      Math.abs(red[index + 2] - blue[index + 2]) > CHANNEL_SHIFT
    ) {
      tintedPixels += 1;
    }
  }

  return (
    inkPixels >= MIN_INK_PIXELS &&
    tintedPixels <= inkPixels * MAX_TINTED_SHARE
  );
};

const detectEmojiSupport = (fontFamily?: string): IEmojiSupport => {
  const canvas = document.createElement("canvas");

  canvas.width = PROBE_SIZE;
  canvas.height = PROBE_SIZE;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) return { maxVersion: MAX_EMOJI_VERSION, hasFlags: true };

  context.textBaseline = "top";
  context.font = `${PROBE_FONT_SIZE}px ${fontFamily || "sans-serif"}`;

  const detectedVersion =
    VERSION_PROBES.find(([, emoji]) =>
      isColorGlyphRendered(context, emoji)
    )?.[0] ?? BASELINE_EMOJI_VERSION;

  return {
    maxVersion: Math.min(MAX_EMOJI_VERSION, detectedVersion),
    hasFlags: isColorGlyphRendered(context, FLAG_PROBE),
  };
};

const isShown = (entry: IEmojibaseEntry, support: IEmojiSupport) =>
  entry.group !== undefined &&
  entry.version <= support.maxVersion &&
  (support.hasFlags || !FLAG_SEQUENCE.test(entry.emoji));

const toEmoji = ({ emoji, label, tags, emoticon }: IEmojibaseEntry): IEmoji => ({
  emoji,
  label,
  keywords: [
    ...(tags ?? []),
    ...(Array.isArray(emoticon) ? emoticon : emoticon ? [emoticon] : []),
  ].map((keyword) => keyword.toLowerCase()),
});

const buildGroups = (
  entries: IEmojibaseEntry[],
  support: IEmojiSupport
): IEmojiGroup[] => {
  const byGroup = new Map<number, IEmojibaseEntry[]>();

  entries.forEach((entry) => {
    if (!isShown(entry, support) || entry.group === undefined) return;

    byGroup.set(entry.group, [...(byGroup.get(entry.group) ?? []), entry]);
  });

  return EMOJI_GROUPS.map((group) => ({
    ...group,
    emojis: (byGroup.get(group.key) ?? [])
      .sort((first, second) => (first.order ?? 0) - (second.order ?? 0))
      .map(toEmoji),
  }));
};

let emojiGroups: Promise<IEmojiGroup[]> | undefined;

export const loadEmojiGroups = (fontFamily?: string) => {
  emojiGroups ??= import("emojibase-data/en/data.json")
    .then(({ default: data }) =>
      buildGroups(
        data as unknown as IEmojibaseEntry[],
        detectEmojiSupport(fontFamily)
      )
    )
    .catch((error) => {
      emojiGroups = undefined;
      throw error;
    });

  return emojiGroups;
};

export const searchEmojis = (groups: IEmojiGroup[], query: string) => {
  const needle = query.trim().toLowerCase();

  if (!needle) return [];

  return groups
    .flatMap((group) => group.emojis)
    .filter(
      (item) =>
        item.emoji === needle ||
        item.label.toLowerCase().includes(needle) ||
        item.keywords.some((keyword) => keyword.startsWith(needle))
    );
};
