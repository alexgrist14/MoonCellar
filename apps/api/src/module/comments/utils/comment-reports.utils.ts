import type { PipelineStage } from "mongoose";
import type { ICommentReportStatus } from "@mooncellar/schemas";

export const REPORTERS_SHOWN = 5;

export const OPEN_REPORT_FILTER = { status: { $ne: "resolved" } };

export const buildReportGroupsPipeline = (
  status: ICommentReportStatus,
  page: number,
  take: number
): PipelineStage[] => {
  const isOpen = status === "open";

  return [
    { $match: isOpen ? OPEN_REPORT_FILTER : { status: "resolved" } },
    { $sort: { createdAt: 1, _id: 1 } },
    {
      $group: {
        _id: isOpen
          ? "$commentId"
          : { commentId: "$commentId", resolvedAt: "$resolvedAt" },
        commentId: { $first: "$commentId" },
        count: { $sum: 1 },
        firstReportedAt: { $first: "$createdAt" },
        lastReportedAt: { $last: "$createdAt" },
        reporterIds: { $push: "$userId" },
        resolution: { $last: "$resolution" },
        resolvedAt: { $last: "$resolvedAt" },
        resolvedBy: { $last: "$resolvedBy" },
      },
    },
    {
      $sort: isOpen
        ? { count: -1, lastReportedAt: -1, commentId: 1 }
        : { resolvedAt: -1, commentId: 1 },
    },
    {
      $facet: {
        results: [
          { $skip: (page - 1) * take },
          { $limit: take },
          {
            $set: {
              reporterIds: { $slice: ["$reporterIds", -REPORTERS_SHOWN] },
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ];
};
