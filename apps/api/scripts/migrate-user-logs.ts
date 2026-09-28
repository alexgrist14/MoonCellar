import mongoose from "mongoose";
import { config } from "dotenv";
import {
  categoriesZod,
  type ILogChanges,
  type ILogPlaythroughState,
} from "@mooncellar/schemas";
import {
  compact,
  isEmptyLog,
  mergeLogChanges,
  toLogUpdate,
} from "../src/module/user/utils/user-logs.utils";

config();

const APPLY = process.argv.includes("--apply");
const SAMPLES = 12;

const SEGMENT_MARKER_REGEX = /<!--segment:([a-z]+)-->/g;
const COMMENT_BLOCK_REGEX =
  /<div style="font-size: 12px">Comment:<\/div>[\s\S]*$/;
const LEGACY_COMMENT_REGEX = /(?:<br\/>)?Comment:[\s\S]*?(?=<\/span>|$)/;
const DETAIL_LINE_REGEX = /^(Status|Console|Date|Time):\s*(.*)$/;
const RATING_REGEX =
  /^(?:Set rating|Set rating to|Updated rating to|Update rating to)\s+(\d+(?:\.\d+)?)$/;
const CATEGORY_LINE_REGEX = /^(Added to|Removed from)\s+([a-z]+)$/i;
const SEGMENT_TITLES: Record<string, string> = {
  "Added game to playthroughs": "added",
  "Updated playthrough": "updated",
  "Removed playthrough": "removed",
};

type ILegacyLog = { _id: mongoose.Types.ObjectId; text: string };

interface IParseResult {
  events: ILogChanges[];
  problems: string[];
  warnings: string[];
}

let platformIds = new Map<string, string>();

function toPlainLines(html: string): string[] {
  return html
    .replace(COMMENT_BLOCK_REGEX, "")
    .replace(LEGACY_COMMENT_REGEX, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(div|p|span)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toStatusState(status: string): ILogPlaythroughState | undefined {
  const key = status.trim().toLowerCase();

  if (key === "mastered") return { category: "completed", isMastered: true };

  const category = categoriesZod.safeParse(key);

  return category.success ? { category: category.data } : undefined;
}

const toPlatformState = (name: string): ILogPlaythroughState =>
  compact({ platform: name, platformId: platformIds.get(name) });

function parseDetails(lines: string[], result: IParseResult) {
  const state: ILogPlaythroughState = {};

  lines.forEach((line) => {
    const detail = line.match(DETAIL_LINE_REGEX);

    if (!detail) return;

    const [, key, value] = detail;

    if (value === "—") {
      result.warnings.push(`cleared ${key} dropped`);
      return;
    }

    if (key === "Status") {
      const status = toStatusState(value);

      if (status) Object.assign(state, status);
      else result.problems.push(`unknown status: ${value}`);
    } else if (key === "Console") {
      Object.assign(state, toPlatformState(value));
    } else if (key === "Date") {
      const date = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

      if (date) state.date = `${date[3]}-${date[2]}-${date[1]}`;
      else result.problems.push(`unknown date: ${value}`);
    } else {
      const time = Number.parseFloat(value);

      if (Number.isFinite(time)) state.time = time;
      else result.problems.push(`unknown time: ${value}`);
    }
  });

  return state;
}

function parseRating(line: string): ILogChanges | undefined {
  const rating = line.match(RATING_REGEX);

  if (rating) return { rating: { value: Number(rating[1]) } };
  if (/^Removed rating$/.test(line)) return { rating: { value: null } };

  return undefined;
}

function parseLegacyLines(lines: string[], result: IParseResult) {
  let lastState: ILogPlaythroughState | undefined;

  lines.forEach((line) => {
    const category = line.match(CATEGORY_LINE_REGEX);

    if (category) {
      const isAdded = /^added/i.test(category[1]);

      lastState = undefined;

      if (/^favou?rites$/i.test(category[2])) {
        result.events.push({ favorite: isAdded });
        return;
      }

      const state = toStatusState(category[2]);

      if (!state) {
        result.problems.push(`unknown category: ${line}`);
        return;
      }

      lastState = state;
      result.events.push({
        playthrough: isAdded
          ? { action: "added", after: state }
          : { action: "removed", before: state },
      });
      return;
    }

    const rating = parseRating(line);

    if (rating) {
      lastState = undefined;
      result.events.push(rating);
      return;
    }

    if (lastState && !lastState.platform) {
      Object.assign(lastState, toPlatformState(line));
      return;
    }

    result.problems.push(`unknown line: ${line}`);
  });
}

function parseSegment(kind: string, html: string, result: IParseResult) {
  const lines = toPlainLines(html);
  const [title = ""] = lines;

  switch (kind) {
    case "added":
      result.events.push({
        playthrough: { action: "added", after: parseDetails(lines, result) },
      });
      return;
    case "updated": {
      const after = parseDetails(lines, result);

      if (Object.keys(after).length) {
        result.events.push({ playthrough: { action: "updated", after } });
      } else {
        result.warnings.push("updated without details dropped");
      }
      return;
    }
    case "list":
      result.warnings.push("list segment dropped");
      return;
    case "removed":
      if (!(title in SEGMENT_TITLES)) break;

      result.events.push({
        playthrough: {
          action: "removed",
          before: parseDetails(lines, result),
        },
      });
      return;
    case "rating": {
      const rating = parseRating(title);

      if (rating) result.events.push(rating);
      else result.problems.push(`unknown rating: ${title}`);
      return;
    }
    case "favorite":
      if (/^Added to favourites$/.test(title)) {
        result.events.push({ favorite: true });
        return;
      }
      if (/^Removed from favourites$/.test(title)) {
        result.events.push({ favorite: false });
        return;
      }
      break;
  }

  const legacyKind = SEGMENT_TITLES[title];

  if (legacyKind && legacyKind !== kind) {
    parseSegment(legacyKind, html, result);
    return;
  }

  parseLegacyLines(lines, result);
}

function parseLog(text: string): IParseResult {
  const result: IParseResult = { events: [], problems: [], warnings: [] };
  const markers = [...text.matchAll(SEGMENT_MARKER_REGEX)];

  if (!markers.length) {
    parseSegment("legacy", text, result);
    return result;
  }

  markers.forEach((marker, i) => {
    const start = (marker.index ?? 0) + marker[0].length;
    const end = markers[i + 1]?.index ?? text.length;

    parseSegment(marker[1], text.slice(start, end), result);
  });

  return result;
}

async function main() {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING!, {
    dbName: "games",
    autoIndex: false,
  });

  const db = mongoose.connection.db!;
  const platforms = await db
    .collection<{ _id: mongoose.Types.ObjectId; name: string }>("platforms")
    .find({}, { projection: { name: 1 } })
    .toArray();

  platformIds = new Map(platforms.map((p) => [p.name, p._id.toString()]));

  const logs = db.collection<ILegacyLog>("userlogs");
  const legacy = await logs
    .find({ text: { $exists: true } }, { projection: { text: 1 } })
    .toArray();

  const converted: { log: ILegacyLog; changes: ILogChanges }[] = [];
  const cancelled: ILegacyLog[] = [];
  const skipped: { log: ILegacyLog; problems: string[] }[] = [];
  const warnings = new Map<string, number>();
  let unknownPlatforms = 0;

  legacy.forEach((log) => {
    const result = parseLog(log.text);

    result.warnings.forEach((w) => warnings.set(w, (warnings.get(w) ?? 0) + 1));

    if (result.problems.length) {
      skipped.push({ log, problems: result.problems });
      return;
    }

    const changes = result.events.reduce<ILogChanges>(
      (merged, event) => mergeLogChanges(merged, event),
      {}
    );

    if (isEmptyLog(changes)) {
      cancelled.push(log);
      return;
    }

    const { before, after } = changes.playthrough ?? {};

    if ([before, after].some((s) => s?.platform && !s.platformId)) {
      unknownPlatforms += 1;
    }

    converted.push({ log, changes });
  });

  console.log(`Logs in the old format: ${legacy.length}`);
  console.log(`  converted: ${converted.length}`);
  console.log(`  empty or cancelled out (deleted): ${cancelled.length}`);
  console.log(`  skipped, need review: ${skipped.length}`);
  console.log(`  platform name without a matching platform: ${unknownPlatforms}`);
  warnings.forEach((count, warning) => console.log(`  warning "${warning}": ${count}`));

  const step = Math.max(1, Math.floor(converted.length / SAMPLES));

  console.log("\nSamples:");
  converted
    .filter((_, i) => i % step === 0)
    .slice(0, SAMPLES)
    .forEach(({ log, changes }) => {
      console.log(`- ${log._id}\n  ${log.text}\n  → ${JSON.stringify(changes)}`);
    });

  if (cancelled.length) {
    console.log("\nEmpty or cancelled out:");
    cancelled.forEach((log) => console.log(`- ${log._id}: ${log.text}`));
  }

  if (skipped.length) {
    console.log("\nSkipped:");
    skipped.forEach(({ log, problems }) =>
      console.log(`- ${log._id}: ${problems.join("; ")}\n  ${log.text}`)
    );
  }

  if (!APPLY) {
    console.log("\nDry run, nothing written. Pass --apply to write.");
    await mongoose.disconnect();
    return;
  }

  const result = await logs.bulkWrite([
    ...converted.map(({ log, changes }) => {
      const { $set, $unset } = toLogUpdate(changes);

      return {
        updateOne: {
          filter: { _id: log._id, text: log.text },
          update: { $set, $unset: { ...$unset, text: "", type: "" } },
        },
      };
    }),
    ...cancelled.map((log) => ({
      deleteOne: { filter: { _id: log._id, text: log.text } },
    })),
  ]);

  console.log(
    `\nUpdated ${result.modifiedCount}, deleted ${result.deletedCount}`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
