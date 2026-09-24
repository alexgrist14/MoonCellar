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
import { Loader } from "@/src/lib/shared/ui/Loader";
import { TextareaField } from "@/src/lib/shared/ui/Fields";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { RELATION_LABELS } from "@/src/lib/shared/constants/related-games.const";
import { IRelatedGameKey } from "@mooncellar/schemas";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { getRequestTitle } from "@/src/lib/entities/request/model/request.utils";
import styles from "./RequestsReview.module.scss";

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
      <div className={styles.placeholder}>
        <Loader />
      </div>
    );
  }

  const fields = Object.keys(request.payload);
  const applied = fields.filter((field) => !skipped.includes(field));
  const imageCount = applied
    .filter((field) => IMAGE_FIELDS.includes(field))
    .reduce((sum, field) => sum + toList(request.payload[field]).length, 0);
  const isPending_ = request.status === "pending";

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
      return (
        <ul className={styles.diff__links}>
          {items.map((url) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={styles.diff__url}
              >
                {url}
              </a>
            </li>
          ))}
        </ul>
      );
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

  const handleDecision = (decision: "approve" | "reject") => {
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
        },
      },
      {
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
          <h3 className={styles.panel__title}>{getRequestTitle(request)}</h3>
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
          <ul className={styles.diff__links}>
            {request.sources.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={styles.diff__url}
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.diff}>
        <table className={styles.diff__table}>
          <thead>
            <tr>
              <th>
                <span className={styles.srOnly}>Apply</span>
              </th>
              <th>Field</th>
              <th>Current</th>
              <th>Proposed</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => {
              const isApplied = applied.includes(field);
              const wasApplied = request.appliedFields?.includes(field);

              return (
                <tr
                  key={field}
                  className={isApplied ? undefined : styles.diff__row_off}
                >
                  <td>
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
                  </td>
                  <td className={styles.diff__field}>
                    {FIELD_LABELS[field] ?? field}
                  </td>
                  <td className={styles.diff__old}>
                    {format(field, request.current?.[field])}
                    {APPENDED_FIELDS.includes(field) && request.current && (
                      <span className={styles.diff__hint}>
                        Proposed values are added to these
                      </span>
                    )}
                  </td>
                  <td className={styles.diff__new}>
                    {format(field, request.payload[field])}
                    {IMAGE_FIELDS.includes(field) && (
                      <span className={styles.diff__hint}>
                        Copied to storage on approval
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isPending_ ? (
        <div className={styles.decision}>
          {request.kind === "game" && request.action === "update" && (
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
