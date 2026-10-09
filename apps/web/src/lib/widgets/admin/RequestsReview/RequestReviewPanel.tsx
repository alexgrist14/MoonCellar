"use client";

import { FC, ReactNode, useMemo, useState } from "react";
import {
  useDecideRequestMutation,
  useRequestQuery,
} from "@/src/lib/entities/request/api";
import { RequestStatus } from "@/src/lib/entities/request/ui/RequestStatus";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { revalidateGamePage } from "@/src/lib/entities/game/api/game.actions";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { Table } from "@/src/lib/shared/ui/Table";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { TextareaField } from "@/src/lib/shared/ui/Fields";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { RELATION_LABELS } from "@/src/lib/shared/constants/related-games.const";
import { IRelatedGameKey } from "@mooncellar/schemas";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { getRequestTitle } from "@/src/lib/entities/request/model/request.utils";
import styles from "./RequestsReview.module.scss";
import { confirmPossibleDuplicates } from "@/src/lib/entities/game/ui/PossibleDuplicates";
import { getPossibleDuplicates } from "@/src/lib/shared/utils/possible-duplicates.utils";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  alternative_names: "Alternative names",
  first_release: "First release",
  platformIds: "Platforms",
  genres: "Genres",
  developer: "Developer",
  publisher: "Publisher",
  summary: "Summary",
  storyline: "Storyline",
  versionTitle: "Edition or version",
  type: "Type",
  status: "Status",
  release_dates: "Release dates",
  modes: "Game modes",
  themes: "Themes",
  keywords: "Keywords",
  franchises: "Franchises",
  game_engines: "Game engines",
  player_perspectives: "Player perspectives",
  languages: "Languages",
  companies: "Companies",
  multiplayer_modes: "Multiplayer",
  ageRatings: "Age ratings",
  websites: "Websites",
  externalPages: "Store pages",
  videos: "Videos",
  relatedGames: "Related games",
  parentGameId: "Main game",
  igdbId: "IGDB id",
  vndbId: "VNDB id",
  hltbId: "HLTB id",
  retroachievements: "RetroAchievements",
  cover: "Cover",
  screenshots: "Screenshots",
  artworks: "Artworks",
  akas: "Also known as",
  gameIds: "Games",
  gender: "Gender",
  species: "Species",
  countryName: "From",
  description: "Description",
  mugShot: "Portrait",
};

const IMAGE_FIELDS = ["cover", "screenshots", "artworks", "mugShot"];
const LINK_FIELDS = ["websites", "videos"];
const APPENDED_FIELDS = [
  "screenshots",
  "artworks",
  "relatedGames",
  "retroachievements",
];

const DIFF_COLUMN_STYLES = {
  apply: { width: "48px", minWidth: "48px" },
  field: { width: "max-content", minWidth: "120px" },
  current: { minWidth: "200px" },
  proposed: { minWidth: "200px" },
};

type IRow = Record<string, unknown>;

const relatedIds = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? Object.values(value as Record<string, unknown>).flatMap((ids) =>
        Array.isArray(ids) ? ids.map(String) : ids ? [String(ids)] : []
      )
    : [];

const toList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(String)
    : value === undefined || value === null || value === ""
      ? []
      : [String(value)];

const UrlList: FC<{ urls: string[] }> = ({ urls }) => (
  <div className={styles.diff__urls}>
    {urls.map((url) => (
      <Chip
        key={url}
        href={url}
        title={url}
        variant="outlined"
        isExternal
        isNoFollow
      >
        {url}
      </Chip>
    ))}
  </div>
);

export const RequestReviewPanel: FC<{ requestId: string }> = ({
  requestId,
}) => {
  const systems = useCommonStore((s) => s.systems);
  const { data: request, isLoading } = useRequestQuery(requestId);
  const { mutate: decide, isPending } = useDecideRequestMutation();

  const [skipped, setSkipped] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [lockSync, setLockSync] = useState(false);

  const gameIds = useMemo(
    () => [
      ...new Set([
        ...toList(request?.payload.gameIds),
        ...toList(request?.current?.gameIds),
        ...toList(request?.payload.parentGameId),
        ...toList(request?.current?.parentGameId),
        ...relatedIds(request?.payload.relatedGames),
        ...relatedIds(request?.current?.relatedGames),
      ]),
    ],
    [request]
  );
  const { data: linkedGames = [] } = useGamesByIdsQuery(
    gameIds,
    undefined,
    gameIds.length > 0
  );

  if (isLoading || !request) {
    return (
      <div role="status" aria-label="Loading">
        <Skeleton
          height="var(--requests-panel-min-height)"
          radius="var(--radius-x4)"
        />
      </div>
    );
  }

  const fields = Object.keys(request.payload);
  const applied = fields.filter((field) => !skipped.includes(field));
  const imageCount = applied
    .filter((field) => IMAGE_FIELDS.includes(field))
    .reduce((sum, field) => sum + toList(request.payload[field]).length, 0);
  const isPending_ = request.status === "pending";
  const isAppended = (field: string) =>
    APPENDED_FIELDS.includes(field) ||
    (field === "gameIds" && request.kind === "character");

  const platformName = (id: unknown) =>
    systems?.find((system) => system._id === id)?.name ?? String(id ?? "");
  const gameName = (id: unknown) =>
    linkedGames.find((game) => game._id === id)?.name ?? String(id ?? "");

  const formatRow = (field: string, row: IRow): string => {
    if (field === "release_dates") {
      return [
        row.human ?? commonUtils.formatDate(new Date(Number(row.date) * 1000)),
        platformName(row.platformId),
      ].join(" · ");
    }

    if (field === "companies") {
      const roles = ["developer", "publisher", "porting", "supporting"].filter(
        (role) => row[role]
      );

      return roles.length
        ? `${row.name} (${roles.join(", ")})`
        : String(row.name);
    }

    if (field === "multiplayer_modes") {
      const details = Object.entries(row)
        .filter(([key, value]) => key !== "platformId" && value)
        .map(([key, value]) => (value === true ? key : `${key} ${value}`));

      return [
        row.platformId ? platformName(row.platformId) : "Any platform",
        ...details,
      ].join(" · ");
    }

    if (field === "retroachievements") {
      return `game ${row.gameId} · console ${row.consoleId}`;
    }

    return Object.values(row).filter(Boolean).join(" · ");
  };

  const format = (field: string, value: unknown): ReactNode => {
    if (field === "relatedGames") {
      const entries = Object.entries(
        (value as Record<string, unknown>) ?? {}
      ).filter(([, ids]) => (Array.isArray(ids) ? ids.length : !!ids));

      if (!entries.length) return <span className={styles.diff__empty}>—</span>;

      return (
        <ul className={styles.diff__links}>
          {entries.map(([key, ids]) => (
            <li key={key}>
              {RELATION_LABELS[key as IRelatedGameKey] ?? key}:{" "}
              {toList(ids).map(gameName).join(", ")}
            </li>
          ))}
        </ul>
      );
    }

    if (
      Array.isArray(value) &&
      value.some((item) => item && typeof item === "object")
    ) {
      return (
        <ul className={styles.diff__links}>
          {(value as IRow[]).map((row, index) => (
            <li key={index}>{formatRow(field, row)}</li>
          ))}
        </ul>
      );
    }

    const items = toList(value);

    if (!items.length) return <span className={styles.diff__empty}>—</span>;

    if (IMAGE_FIELDS.includes(field) || LINK_FIELDS.includes(field)) {
      return <UrlList urls={items} />;
    }

    if (field === "first_release") {
      return commonUtils.formatDate(new Date(Number(value) * 1000));
    }

    if (field === "platformIds") {
      return items
        .map((id) => systems?.find((system) => system._id === id)?.name ?? id)
        .join(", ");
    }

    if (field === "gameIds" || field === "parentGameId") {
      return items.map(gameName).join(", ");
    }

    return items.join(", ");
  };

  const handleDecision = (decision: "approve" | "reject", force?: boolean) => {
    if (decision === "reject" && !reason.trim()) {
      toast.error({ description: "Write a reason for the author first" });
      return;
    }

    decide(
      {
        id: request._id,
        body: {
          decision,
          fields: decision === "approve" ? applied : undefined,
          reason: reason.trim() || undefined,
          lockSync: decision === "approve" && lockSync ? true : undefined,
          force,
        },
      },
      {
        onError: (error) => {
          const duplicates = getPossibleDuplicates(error);

          if (duplicates) {
            confirmPossibleDuplicates(
              duplicates,
              () => handleDecision("approve", true),
              request.kind
            );
          }
        },
        onSuccess: async ({ request: decided, failedImages, warnings }) => {
          toast.success({
            description:
              decision === "approve" ? "Request approved" : "Request rejected",
          });

          if (failedImages.length) {
            toast.error({
              title: `${failedImages.length} image(s) could not be copied`,
              description: failedImages.join("\n"),
            });
          }

          if (warnings.length) {
            toast.error({
              title: "Approved with warnings",
              description: warnings.join("\n"),
            });
          }

          if (decision !== "approve") return;

          const slugs =
            decided.kind === "game"
              ? [decided.targetSlug, decided.resultSlug]
              : linkedGames.map((game) => game.slug);

          await revalidateGamePage(...slugs.filter(Boolean).map(String));
        },
      }
    );
  };

  return (
    <article className={styles.panel}>
      <header className={styles.panel__head}>
        <div>
          <SectionTitle as="h3">{getRequestTitle(request)}</SectionTitle>
          <p className={styles.panel__by}>
            {request.action === "add" ? "New" : "Update to"} {request.kind} · by{" "}
            <b>{request.userName ?? "unknown"}</b> ·{" "}
            {commonUtils.getHumanDate(request.createdAt)}
          </p>
        </div>
        <RequestStatus status={request.status} />
      </header>

      {!!request.note && (
        <div className={styles.panel__note}>
          <span>Note from the author</span>
          {request.note}
        </div>
      )}

      {!!request.sources.length && (
        <div className={styles.panel__note}>
          <span>Sources</span>
          <UrlList urls={request.sources} />
        </div>
      )}

      <Table
        id="request-diff"
        layout="rows"
        isWithoutSorting
        columnStyles={DIFF_COLUMN_STYLES}
        getRowClassName={(_, index) =>
          applied.includes(fields[index]) ? undefined : styles.diff__row_off
        }
        headers={{
          apply: {
            content: <span className={styles.visuallyHidden}>Apply</span>,
            isNotResizable: true,
          },
          field: { content: "Field" },
          current: { content: "Current" },
          proposed: { content: "Proposed" },
        }}
        rows={fields.map((field) => {
          const isApplied = applied.includes(field);
          const wasApplied = request.appliedFields?.includes(field);

          return {
            apply: {
              content: (
                <Checkbox
                  checked={isPending_ ? isApplied : !!wasApplied}
                  disabled={!isPending_ || isPending}
                  aria-label={`Apply ${FIELD_LABELS[field] ?? field}`}
                  onChange={(event) =>
                    setSkipped((current) =>
                      event.target.checked
                        ? current.filter((item) => item !== field)
                        : [...current, field]
                    )
                  }
                />
              ),
            },
            field: {
              content: FIELD_LABELS[field] ?? field,
              className: styles.diff__field,
            },
            current: {
              content: (
                <div>
                  {format(field, request.current?.[field])}
                  {isAppended(field) && request.current && (
                    <span className={styles.diff__hint}>
                      Proposed values are added to these
                    </span>
                  )}
                </div>
              ),
              className: styles.diff__old,
            },
            proposed: {
              content: (
                <div>
                  {format(field, request.payload[field])}
                  {IMAGE_FIELDS.includes(field) && (
                    <span className={styles.diff__hint}>
                      Copied to storage on approval
                    </span>
                  )}
                </div>
              ),
              className: styles.diff__new,
            },
          };
        })}
      />

      {isPending_ ? (
        <div className={styles.decision}>
          {request.kind === "game" && (
            <label className={styles.decision__lock}>
              <Checkbox
                checked={lockSync}
                onChange={(event) => setLockSync(event.target.checked)}
              />
              Stop IGDB parsing for this game, so the next sync does not
              overwrite these changes
            </label>
          )}
          <TextareaField
            label="Reason, shown to the author (required to reject)"
            value={reason}
            onChange={setReason}
          />
          <div className={styles.decision__actions}>
            <Button
              color={ButtonColor.RED}
              disabled={isPending}
              onClick={() => handleDecision("reject")}
            >
              Reject
            </Button>
            <Button
              color={ButtonColor.GREEN}
              disabled={isPending || !applied.length}
              onClick={() => handleDecision("approve")}
            >
              {`Approve ${applied.length} of ${fields.length}`}
              {imageCount ? ` · copy ${imageCount} image(s)` : ""}
            </Button>
          </div>
        </div>
      ) : (
        !!request.reason && (
          <div className={styles.panel__note}>
            <span>Moderator&apos;s reason</span>
            {request.reason}
          </div>
        )
      )}
    </article>
  );
};
