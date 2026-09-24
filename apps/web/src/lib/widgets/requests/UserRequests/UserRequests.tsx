"use client";

import { FC } from "react";
import Link from "next/link";
import { IContentRequest, IContentRequestKind } from "@mooncellar/schemas";
import {
  useMyRequestsQuery,
  useWithdrawRequestMutation,
} from "@/src/lib/entities/request/api";
import { RequestStatus } from "@/src/lib/entities/request/ui/RequestStatus";
import { getRequestTitle } from "@/src/lib/entities/request/model/request.utils";
import { RequestForm } from "@/src/lib/features/requests/ui/RequestForm";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { ISearchPickerOption } from "@/src/lib/shared/ui/SearchPicker";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import styles from "./UserRequests.module.scss";

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
  const { data: requests = [], isLoading } = useMyRequestsQuery();
  const { mutate: withdraw, isPending } = useWithdrawRequestMutation();

  return (
    <div className={styles.layout}>
      <RequestForm initialKind={initialKind} initialTarget={initialTarget} />
      <aside className={styles.mine} aria-labelledby="my-requests">
        <h3 id="my-requests" className={styles.mine__title}>
          My requests
          {!!requests.length && <span>{requests.length}</span>}
        </h3>
        {isLoading && (
          <div className={styles.loading}>
            <Loader />
          </div>
        )}
        {!isLoading && !requests.length && (
          <p className={styles.empty}>
            Nothing sent yet. Requests you send appear here with the
            moderator&apos;s decision.
          </p>
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
                    onClick={() =>
                      withdraw(request._id, {
                        onSuccess: () =>
                          toast.success({ description: "Request withdrawn" }),
                      })
                    }
                  >
                    Withdraw
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
};
