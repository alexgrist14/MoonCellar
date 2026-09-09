import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { setPagination } from "src/shared/pagination";
import {
  IGetUserLogsRequest,
  ILog,
  IRemoveUserLogRequest,
  IUserLog,
} from "src/shared/zod/schemas/user-logs.schema";
import { UserLogs } from "../schemas/user-logs.schema";

export type ILogSegment = "added" | "updated" | "removed" | "rating";

export interface ICreateUserLogParams extends IUserLog {
  segment: ILogSegment;
}

export interface IRemoveUserLogSegmentParams {
  userId: string;
  gameId: string;
  segment: ILogSegment;
  fallbackType: IUserLog["type"];
  fallbackText: string;
}

interface IParsedLogSegment {
  segment: string;
  content: string;
}

const SEGMENT_MARKER_REGEX = /<!--segment:([a-z]+)-->/g;
const DETAILS_REGEX =
  /(?:<br\/>)*<span style="font-size: 12px">[\s\S]*?<\/span>/g;
const DETAILS_SEGMENTS_PRIORITY = ["removed", "updated", "added"];

function buildSegmentMarker(segment: string) {
  return `<!--segment:${segment}-->`;
}

function classifySegment(segment: string, content: string): string {
  if (segment !== "legacy") return segment;

  if (/^(Set rating|Update rating to|Removed rating)/.test(content)) {
    return "rating";
  }
  if (content.includes("Added game to playthroughs")) return "added";
  if (content.includes("Updated playthrough")) return "updated";
  if (content.startsWith("Removed from")) return "removed";

  return "legacy";
}

function parseLogSegments(text: string): IParsedLogSegment[] {
  const matches = [...text.matchAll(SEGMENT_MARKER_REGEX)];

  if (!matches.length) {
    return [{ segment: classifySegment("legacy", text), content: text }];
  }

  return matches.map((match, i) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[i + 1]?.index ?? text.length;
    const isLast = i === matches.length - 1;
    const rawContent = text.slice(start, end);
    const content = isLast
      ? rawContent
      : rawContent.replace(/(?:<br\/>)+$/, "");

    return { segment: classifySegment(match[1], content), content };
  });
}

function buildLogText(segments: IParsedLogSegment[]): string {
  return segments
    .map(({ segment, content }) => `${buildSegmentMarker(segment)}${content}`)
    .join("<br/><br/>");
}

function stripDuplicatedDetails(
  segments: IParsedLogSegment[]
): IParsedLogSegment[] {
  const present = DETAILS_SEGMENTS_PRIORITY.filter((segment) =>
    segments.some((s) => s.segment === segment)
  );

  if (present.length < 2) return segments;

  const [kept] = present;

  return segments.map((s) =>
    s.segment !== kept && present.includes(s.segment)
      ? { ...s, content: s.content.replace(DETAILS_REGEX, "") }
      : s
  );
}

function renderLogText(text: string): string {
  return stripDuplicatedDetails(parseLogSegments(text))
    .map(({ content }) => content)
    .join("<br/><br/>");
}

@Injectable()
export class UserLogsService {
  private readonly logger = new Logger(UserLogsService.name);
  constructor(
    @InjectModel(UserLogs.name) private userLogsModel: Model<UserLogs>
  ) {}

  async createUserLog({
    userId,
    type,
    text,
    gameId,
    segment,
  }: ICreateUserLogParams) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const gameObjectId = new mongoose.Types.ObjectId(gameId);
      const lastLog = await this.userLogsModel
        .findOne({ userId: userObjectId })
        .sort({ date: -1 });

      const isSameLog = lastLog?.gameId?.toString() === gameId?.toString();

      if (!lastLog || !isSameLog) {
        const userLog = await this.userLogsModel.create({
          date: new Date(),
          text: buildLogText([{ segment, content: text }]),
          type,
          gameId: gameObjectId,
          userId: userObjectId,
        });
        return userLog.save();
      }

      const existingSegments = parseLogSegments(lastLog.text);
      const segments = existingSegments.filter((s) => s.segment !== segment);
      segments.push({ segment, content: text });

      const newText = buildLogText(segments);

      if (newText === lastLog.text) return;

      lastLog.text = newText;
      lastLog.type = type;
      lastLog.date = new Date();
      return await lastLog.save();
    } catch (err) {
      this.logger.error(err, `Failed to create user log: ${userId}`);
      throw err;
    }
  }

  async removeUserLogSegment({
    userId,
    gameId,
    segment,
    fallbackType,
    fallbackText,
  }: IRemoveUserLogSegmentParams) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const gameObjectId = new mongoose.Types.ObjectId(gameId);
      const lastLog = await this.userLogsModel
        .findOne({ userId: userObjectId })
        .sort({ date: -1 });

      const isSameLog = lastLog?.gameId?.toString() === gameId?.toString();

      if (!lastLog || !isSameLog) {
        const userLog = await this.userLogsModel.create({
          date: new Date(),
          text: buildLogText([{ segment, content: fallbackText }]),
          type: fallbackType,
          gameId: gameObjectId,
          userId: userObjectId,
        });
        return userLog.save();
      }

      const existingSegments = parseLogSegments(lastLog.text);
      const hadSegment = existingSegments.some((s) => s.segment === segment);

      if (!hadSegment) {
        const segments = [
          ...existingSegments,
          { segment, content: fallbackText },
        ];
        const newText = buildLogText(segments);

        if (newText === lastLog.text) return;

        lastLog.text = newText;
        lastLog.type = fallbackType;
        lastLog.date = new Date();
        return await lastLog.save();
      }

      const remainingSegments = existingSegments.filter(
        (s) => s.segment !== segment
      );

      if (!remainingSegments.length) {
        return await this.userLogsModel.deleteOne({ _id: lastLog._id });
      }

      lastLog.text = buildLogText(remainingSegments);
      lastLog.date = new Date();
      return await lastLog.save();
    } catch (err) {
      this.logger.error(err, `Failed to remove user log segment: ${userId}`);
      throw err;
    }
  }

  async removeUserLog({ _id, userId }: IRemoveUserLogRequest) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      return await this.userLogsModel.deleteOne({
        _id,
        userId: userObjectId,
      });
    } catch (err) {
      this.logger.error(err, `Failed to remove user log: ${_id}`);
      throw err;
    }
  }

  async getUserLogs(
    userId: string,
    { take = 30, page = 1 }: IGetUserLogsRequest
  ): Promise<{ results: ILog[]; total: number }> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const pagination = setPagination(page, take);

      const [logs, total] = await Promise.all([
        this.userLogsModel.aggregate([
          {
            $match: { userId: userObjectId },
          },
          {
            $sort: { date: -1 },
          },
          ...pagination,
        ]),
        this.userLogsModel.countDocuments({ userId: userObjectId }),
      ]);

      return {
        results: logs.map((log) => ({
          ...log,
          text: renderLogText(log.text),
        })),
        total,
      };
    } catch (err) {
      this.logger.error(err, `Failed to get user logs: ${userId}`);
      throw err;
    }
  }
}
