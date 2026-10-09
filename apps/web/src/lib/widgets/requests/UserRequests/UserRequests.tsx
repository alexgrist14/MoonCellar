"use client";

import { FC, useState } from "react";
import Link from "next/link";
import {
  CONTENT_REQUESTS_PAGE_SIZE,
  IContentRequest,
  IContentRequestKind,
} from "@mooncellar/schemas";
import {
  useMyRequestsQuery,
  useWithdrawRequestMutation,
} from "@/src/lib/entities/request/api";
import { RequestStatus } from "@/src/lib/entities/request/ui/RequestStatus";
import { getRequestTitle } from "@/src/lib/entities/request/model/request.utils";
import { RequestForm } from "@/src/lib/features/requests/ui/RequestForm";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { modal } from "@/src/lib/shared/ui/Modal";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { ISearchPickerOption } from "@/src/lib/shared/ui/SearchPicker";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./UserRequests.module.scss";

const WITHDRAW_MODAL_ID = "withdraw-request";

const describe = (request: IContentRequest) => {
  const noun = request.kind === "game" ? "game" : "character";
  const fields = Object.keys(request.payload).length;

  return request.action === "add"
    ? `New ${noun}`
    : `Update · ${fields} field${fields === 1 ? "" : "s"}`;
};

const getHref = (request: IContentRequest) => {
  const slug = request.resultSlug ?? request.targetSlug;

  return request.kind === "game" && slug ? `/games/${slug}` : undefined;
};

interface IUserRequestsProps {
  initialKind?: IContentRequestKind;
  initialTarget?: ISearchPickerOption;
}

export const UserRequests: FC<IUserRequestsProps> = ({
  initialKind,
  initialTarget,
}) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useMyRequestsQuery({
    page,
    take: CONTENT_REQUESTS_PAGE_SIZE,
  });
  const requests = data?.results ?? [];
  const total = data?.total ?? 0;
  const { mutateAsync: withdraw, isPending } = useWithdrawRequestMutation();

  const confirmWithdraw = (request: IContentRequest) =>
    modal.open(
      <ConfirmModal
        title="Withdraw request"
        message={`Withdraw “${getRequestTitle(request)}”? Moderators will no longer see it.`}
        confirmText="Withdraw"
        onCancel={() => modal.close(WITHDRAW_MODAL_ID)}
        onConfirm={async () => {
          await withdraw(request._id);
          modal.close(WITHDRAW_MODAL_ID);
          toast.success({ description: "Request withdrawn" });
        }}
      />,
      { id: WITHDRAW_MODAL_ID }
    );

  return (
    <div className={styles.layout}>
      <RequestForm initialKind={initialKind} initialTarget={initialTarget} />
      <aside className={styles.mine} aria-labelledby="my-requests">
        <SectionTitle as="h3" count={total || undefined}>
          <span id="my-requests">My requests</span>
        </SectionTitle>
        {isLoading && (
          <ul className={styles.list} role="status" aria-label="Loading">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index} className={styles.item}>
                <Skeleton shape="text" width="70%" />
                <Skeleton shape="text" width="40%" />
              </li>
            ))}
          </ul>
        )}
        {!isLoading && !requests.length && (
          <EmptyState
            variant="compact"
            title="Nothing sent yet"
            description="Requests you send appear here with the moderator's decision."
          />
        )}
        <ul className={styles.list}>
          {requests.map((request) => {
            const href = getHref(request);

            return (
              <li key={request._id} className={styles.item}>
                <div className={styles.item__top}>
                  {href ? (
                    <Link href={href} className={styles.item__name}>
                      {getRequestTitle(request)}
                    </Link>
                  ) : (
                    <span className={styles.item__name}>
                      {getRequestTitle(request)}
                    </span>
                  )}
                  <RequestStatus status={request.status} />
                </div>
                <p className={styles.item__meta}>
                  {describe(request)} ·{" "}
                  {commonUtils.getHumanDate(request.createdAt)}
                </p>
                {!!request.reason && (
                  <p className={styles.item__reason}>{request.reason}</p>
                )}
                {request.status === "pending" && (
                  <Button
                    compact
                    color={ButtonColor.TRANSPARENT}
                    className={styles.item__withdraw}
                    disabled={isPending}
                    onClick={() => confirmWithdraw(request)}
                  >
                    Withdraw
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {total > CONTENT_REQUESTS_PAGE_SIZE && (
          <Pagination
            take={CONTENT_REQUESTS_PAGE_SIZE}
            total={total}
            page={page}
            onPageChange={setPage}
            isDisabled={isFetching}
            isWithoutSummary
          />
        )}
      </aside>
    </div>
  );
};
