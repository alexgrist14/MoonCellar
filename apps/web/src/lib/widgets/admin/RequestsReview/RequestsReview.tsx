"use client";

import { FC, useState } from "react";
import {
  CONTENT_REQUESTS_PAGE_SIZE,
  IContentRequestKind,
  IContentRequestStatus,
} from "@mooncellar/schemas";
import { useRequestsQuery } from "@/src/lib/entities/request/api";
import { RequestStatus } from "@/src/lib/entities/request/ui/RequestStatus";
import { getRequestTitle } from "@/src/lib/entities/request/model/request.utils";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { RequestReviewPanel } from "./RequestReviewPanel";
import styles from "./RequestsReview.module.scss";

const STATUSES: IContentRequestStatus[] = [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
];
const KINDS: (IContentRequestKind | undefined)[] = [
  undefined,
  "game",
  "character",
];

export const RequestsReview: FC = () => {
  const [status, setStatus] = useState<IContentRequestStatus>("pending");
  const [kind, setKind] = useState<IContentRequestKind>();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();

  const { data, isLoading, isFetching, isPlaceholderData } = useRequestsQuery({
    status,
    kind,
    page,
    take: CONTENT_REQUESTS_PAGE_SIZE,
  });

  const isSwitching = isLoading || isPlaceholderData;
  const requests = isSwitching ? [] : (data?.results ?? []);
  const activeId = requests.some((request) => request._id === selectedId)
    ? selectedId
    : requests[0]?._id;

  return (
    <div className={styles.wrapper}>
      <div className={styles.review}>
        <div className={styles.queue}>
          <div className={styles.filters}>
            <Tabs
              theme="segmented"
              ariaLabel="Status"
              contents={STATUSES.map((item) => ({
                tabName: commonUtils.upFL(item),
                onTabClick: () => {
                  setStatus(item);
                  setPage(1);
                },
              }))}
            />
            <Tabs
              theme="segmented"
              ariaLabel="Kind"
              contents={KINDS.map((item) => ({
                tabName: item ? `${commonUtils.upFL(item)}s` : "All",
                onTabClick: () => {
                  setKind(item);
                  setPage(1);
                },
              }))}
            />
          </div>
          {isSwitching && (
            <div className={styles.loading}>
              <Loader />
            </div>
          )}
          {!isSwitching && !requests.length && (
            <p className={styles.empty}>No {status} requests.</p>
          )}
          <ul className={styles.queue__list}>
            {requests.map((request) => (
              <li key={request._id}>
                <button
                  type="button"
                  className={styles.queue__item}
                  aria-current={request._id === activeId}
                  onClick={() => setSelectedId(request._id)}
                >
                  <span className={styles.queue__name}>
                    {getRequestTitle(request)}
                  </span>
                  <span className={styles.queue__kind}>
                    {request.kind} · {request.action}
                  </span>
                  <span className={styles.queue__meta}>
                    {request.userName ?? "unknown"} ·{" "}
                    {commonUtils.getHumanDate(request.createdAt)}
                  </span>
                  {status !== "pending" && (
                    <RequestStatus status={request.status} />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {isSwitching ? (
          <div className={styles.placeholder}>
            <Loader />
          </div>
        ) : activeId ? (
          <RequestReviewPanel key={activeId} requestId={activeId} />
        ) : (
          <div className={styles.placeholder}>Pick a request to review.</div>
        )}
      </div>
      <Pagination
        take={CONTENT_REQUESTS_PAGE_SIZE}
        total={data?.total ?? 0}
        page={page}
        onPageChange={setPage}
        isDisabled={isFetching}
      />
    </div>
  );
};
