import { FC } from "react";
import { ISiteSession } from "@mooncellar/schemas";
import { useSiteSessionsQuery } from "@/src/lib/entities/site-session/api";
import { ITableCell } from "@/src/lib/shared/types/table.type";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { modal } from "@/src/lib/shared/ui/Modal";
import { Table } from "@/src/lib/shared/ui/Table";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { SiteSessionModal } from "./SiteSessionModal";
import styles from "./SiteSessions.module.scss";

const MODAL_ID = "site-session";

export const SiteSessions: FC = () => {
  const { data: sessions = [], isLoading } = useSiteSessionsQuery();

  const openModal = (session?: ISiteSession) =>
    modal.open(
      <SiteSessionModal
        session={session}
        onClose={() => modal.close(MODAL_ID)}
      />,
      { id: MODAL_ID }
    );

  return (
    <div className={styles.sites}>
      <div className={styles.toolbar}>
        <p className={styles.hint}>
          Cookies and headers the parsers use for sites that need a login, an
          age check or a Referer.
        </p>
        <Button color={ButtonColor.GREEN} onClick={() => openModal()}>
          Add site
        </Button>
      </div>
      <Table
        mobileHeadField="domain"
        isLoading={isLoading}
        columnStyles={{
          domain: { width: "240px", minWidth: "180px" },
          cookie: { width: "120px", minWidth: "100px" },
          userAgent: { width: "240px", minWidth: "160px" },
          referer: { width: "200px", minWidth: "140px" },
          updated: { width: "130px", minWidth: "120px" },
        }}
        headers={{
          domain: { content: "Domain" },
          cookie: { content: "Cookie" },
          userAgent: { content: "User-Agent" },
          referer: { content: "Referer" },
          updated: { content: "Updated" },
        }}
        rows={sessions.map((session) => {
          const cells = {
            domain: { content: session.domain, sortingValue: session.domain },
            cookie: {
              content: session.hasCookie ? "Stored" : "—",
              sortingValue: session.hasCookie ? 1 : 0,
            },
            userAgent: { content: session.userAgent ?? "—" },
            referer: { content: session.referer ?? "—" },
            updated: {
              content: commonUtils.formatDate(session.updatedAt),
              sortingValue: session.updatedAt,
            },
          };

          return Object.fromEntries(
            Object.entries(cells).map(([key, cell]) => [
              key,
              {
                ...cell,
                className: styles.rowClickable,
                onClick: () => openModal(session),
              },
            ])
          ) as Record<keyof typeof cells, ITableCell>;
        })}
      />
    </div>
  );
};
