"use client";

import { FC, useMemo, useState } from "react";
import {
  CONTENT_REQUEST_SCREENSHOTS_MAX,
  IRelatedGameKey,
} from "@mooncellar/schemas";
import { useGameFiltersQuery } from "@/src/lib/entities/game/api/game.queries";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { RELATION_LABELS } from "@/src/lib/shared/constants/related-games.const";
import {
  DateField,
  EnumField,
  EnumListField,
  IObjectFieldDescriptor,
  ObjectListField,
  StringListField,
  TextField,
  TextareaField,
} from "@/src/lib/shared/ui/Fields";
import { SearchPicker } from "@/src/lib/shared/ui/SearchPicker";
import { IGameDraft, IRelatedEntry } from "../../model/game-request.utils";
import { useEntitySearch } from "../../model/useEntitySearch";
import { SelectedChips } from "../SelectedChips";
import styles from "../RequestForm/RequestForm.module.scss";

const RELATION_OPTIONS = (
  Object.keys(RELATION_LABELS) as IRelatedGameKey[]
).filter((key): key is IRelatedEntry["relation"] => key !== "parent_game");

const MULTIPLAYER_FLAGS: [string, string][] = [
  ["campaignCoop", "Campaign coop"],
  ["dropIn", "Drop in"],
  ["lanCoop", "LAN coop"],
  ["offlineCoop", "Offline coop"],
  ["onlineCoop", "Online coop"],
  ["splitscreen", "Splitscreen"],
  ["splitscreenOnline", "Online splitscreen"],
];

const MULTIPLAYER_LIMITS: [string, string][] = [
  ["offlineMax", "Offline players"],
  ["offlineCoopMax", "Offline coop players"],
  ["onlineMax", "Online players"],
  ["onlineCoopMax", "Online coop players"],
];

interface IGameRequestFieldsProps {
  draft: IGameDraft;
  onChange: (draft: IGameDraft) => void;
  isUpdate: boolean;
}

export const GameRequestFields: FC<IGameRequestFieldsProps> = ({
  draft,
  onChange,
  isUpdate,
}) => {
  const systems = useCommonStore((s) => s.systems);
  const { data: filters } = useGameFiltersQuery();
  const relatedSearch = useEntitySearch("game");
  const parentSearch = useEntitySearch("game");
  const [relation, setRelation] = useState<IRelatedEntry["relation"]>();

  const platformNames = useMemo(
    () => (systems ?? []).map((system) => system.name),
    [systems]
  );

  const set =
    <K extends keyof IGameDraft>(key: K) =>
    (value: IGameDraft[K]) =>
      onChange({ ...draft, [key]: value });

  const releaseFields: IObjectFieldDescriptor[] = [
    { key: "date", label: "Date", kind: "date" },
    {
      key: "platform",
      label: "Platform",
      kind: "text",
      options: platformNames,
    },
  ];

  const companyFields: IObjectFieldDescriptor[] = [
    {
      key: "name",
      label: "Name",
      kind: "text",
      options: filters?.companies ?? [],
    },
    { key: "developer", label: "Developer", kind: "boolean" },
    { key: "publisher", label: "Publisher", kind: "boolean" },
    { key: "porting", label: "Porting", kind: "boolean" },
    { key: "supporting", label: "Supporting", kind: "boolean" },
  ];

  const multiplayerFields: IObjectFieldDescriptor[] = [
    {
      key: "platform",
      label: "Platform",
      kind: "text",
      options: platformNames,
    },
    ...MULTIPLAYER_LIMITS.map(([key, label]): IObjectFieldDescriptor => ({
      key,
      label,
      kind: "number",
    })),
    ...MULTIPLAYER_FLAGS.map(([key, label]): IObjectFieldDescriptor => ({
      key,
      label,
      kind: "boolean",
    })),
  ];

  const ageRatingFields: IObjectFieldDescriptor[] = [
    { key: "organization", label: "Organization", kind: "text" },
    { key: "rating", label: "Rating", kind: "text" },
    { key: "synopsis", label: "Synopsis", kind: "text" },
  ];

  const externalPageFields: IObjectFieldDescriptor[] = [
    { key: "name", label: "Store", kind: "text" },
    { key: "uid", label: "Id on the store", kind: "text" },
    { key: "url", label: "Link", kind: "text" },
  ];

  const retroFields: IObjectFieldDescriptor[] = [
    { key: "gameId", label: "Game id", kind: "number" },
    { key: "consoleId", label: "Console id", kind: "number" },
  ];

  return (
    <>
      <section className={styles.group}>
        <h3 className={styles.group__title}>Game</h3>
        <div className={styles.grid}>
          <TextField
            label={isUpdate ? "Name — leave empty to keep" : "Name"}
            value={draft.name}
            onChange={set("name")}
          />
          <TextField
            label="Edition or version"
            value={draft.versionTitle}
            onChange={set("versionTitle")}
          />
          <EnumField
            label="Type"
            value={draft.type}
            options={filters?.type ?? []}
            onChange={(value) => set("type")(value ?? "")}
          />
          <EnumField
            label="Status"
            value={draft.status}
            options={filters?.status ?? []}
            onChange={(value) => set("status")(value ?? "")}
          />
          <DateField
            label="First release"
            value={draft.first_release}
            onChange={set("first_release")}
          />
        </div>
        <StringListField
          label="Alternative names"
          value={draft.alternative_names}
          onChange={set("alternative_names")}
        />
        <TextareaField
          label="Summary"
          value={draft.summary}
          onChange={set("summary")}
        />
        <TextareaField
          label="Storyline"
          value={draft.storyline}
          onChange={set("storyline")}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>
          Release dates
          <span>Date and platform of each release</span>
        </h3>
        <ObjectListField
          label="Release dates"
          isLabelHidden
          value={draft.release_dates}
          fields={releaseFields}
          onChange={set("release_dates")}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>Classification</h3>
        <div className={styles.grid}>
          <EnumListField
            label="Platforms"
            value={draft.platforms}
            options={platformNames}
            onChange={set("platforms")}
          />
          <EnumListField
            label="Genres"
            value={draft.genres}
            options={filters?.genres ?? []}
            onChange={set("genres")}
          />
          <EnumListField
            label="Game modes"
            value={draft.modes}
            options={filters?.modes ?? []}
            onChange={set("modes")}
          />
          <EnumListField
            label="Themes"
            value={draft.themes}
            options={filters?.themes ?? []}
            onChange={set("themes")}
          />
          <EnumListField
            label="Player perspectives"
            value={draft.player_perspectives}
            options={filters?.player_perspectives ?? []}
            onChange={set("player_perspectives")}
          />
          <EnumListField
            label="Game engines"
            value={draft.game_engines}
            options={filters?.game_engines ?? []}
            onChange={set("game_engines")}
          />
          <EnumListField
            label="Languages"
            value={draft.languages}
            options={filters?.languages ?? []}
            onChange={set("languages")}
          />
        </div>
        <StringListField
          label="Franchises"
          value={draft.franchises}
          onChange={set("franchises")}
        />
        <StringListField
          label="Keywords"
          value={draft.keywords}
          onChange={set("keywords")}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>Companies</h3>
        <ObjectListField
          label="Companies"
          isLabelHidden
          value={draft.companies}
          fields={companyFields}
          onChange={set("companies")}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>Multiplayer</h3>
        <ObjectListField
          label="Multiplayer modes"
          isLabelHidden
          value={draft.multiplayer_modes}
          fields={multiplayerFields}
          onChange={set("multiplayer_modes")}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>Age ratings</h3>
        <ObjectListField
          label="Age ratings"
          isLabelHidden
          value={draft.ageRatings}
          fields={ageRatingFields}
          onChange={set("ageRatings")}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>
          Related games
          <span>Added to the existing relations</span>
        </h3>
        {draft.parent ? (
          <SelectedChips
            items={[
              { ...draft.parent, label: `Main game: ${draft.parent.label}` },
            ]}
            onRemove={() => set("parent")(undefined)}
          />
        ) : (
          <SearchPicker
            label="Main game (for a DLC, expansion or edition)"
            placeholder="Search the main game"
            search={parentSearch.search}
            onSearch={parentSearch.setSearch}
            options={parentSearch.options}
            isLoading={parentSearch.isLoading}
            onPick={(option) => {
              set("parent")(option);
              parentSearch.setSearch("");
            }}
          />
        )}
        <div className={styles.grid}>
          <EnumField
            label="Relation"
            value={relation ? RELATION_LABELS[relation] : undefined}
            options={RELATION_OPTIONS.map((key) => RELATION_LABELS[key])}
            onChange={(label) => {
              const key = RELATION_OPTIONS.find(
                (item) => RELATION_LABELS[item] === label
              );

              setRelation(key);
            }}
          />
          <SearchPicker
            label="Game"
            placeholder={
              relation ? "Search a game to relate" : "Pick a relation first"
            }
            disabled={!relation}
            search={relatedSearch.search}
            onSearch={relatedSearch.setSearch}
            options={relatedSearch.options.filter(
              (option) =>
                !draft.related.some(
                  (entry) =>
                    entry.game.id === option.id && entry.relation === relation
                )
            )}
            isLoading={relatedSearch.isLoading}
            onPick={(option) => {
              if (!relation) return;
              set("related")([...draft.related, { relation, game: option }]);
              relatedSearch.setSearch("");
            }}
          />
        </div>
        <SelectedChips
          items={draft.related.map((entry) => ({
            id: `${entry.relation}:${entry.game.id}`,
            label: `${RELATION_LABELS[entry.relation]}: ${entry.game.label}`,
          }))}
          onRemove={(id) =>
            set("related")(
              draft.related.filter(
                (entry) => `${entry.relation}:${entry.game.id}` !== id
              )
            )
          }
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>
          Pictures
          <span>
            Links to images on other sites. Nothing is stored until a moderator
            approves.
          </span>
        </h3>
        <TextField
          label="Cover link"
          value={draft.cover}
          onChange={set("cover")}
        />
        <StringListField
          label={`Screenshot links, up to ${CONTENT_REQUEST_SCREENSHOTS_MAX}`}
          value={draft.screenshots}
          onChange={set("screenshots")}
        />
        <StringListField
          label={`Artwork links, up to ${CONTENT_REQUEST_SCREENSHOTS_MAX}`}
          value={draft.artworks}
          onChange={set("artworks")}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>Links</h3>
        <StringListField
          label="Websites"
          value={draft.websites}
          onChange={set("websites")}
        />
        <StringListField
          label="YouTube videos"
          value={draft.videos}
          onChange={set("videos")}
        />
        <ObjectListField
          label="Store pages"
          value={draft.externalPages}
          fields={externalPageFields}
          onChange={set("externalPages")}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.group__title}>
          Ids on other services
          <span>On approval the game is parsed from these services</span>
        </h3>
        <div className={styles.grid}>
          <TextField
            label="IGDB game id"
            value={draft.igdbId}
            onChange={set("igdbId")}
          />
          <TextField
            label="VNDB id (v17)"
            value={draft.vndbId}
            onChange={set("vndbId")}
          />
          <TextField
            label="HowLongToBeat id"
            value={draft.hltbId}
            onChange={set("hltbId")}
          />
        </div>
        <ObjectListField
          label="RetroAchievements"
          value={draft.retroachievements}
          fields={retroFields}
          onChange={set("retroachievements")}
        />
      </section>
    </>
  );
};
