import { IObjectFieldDescriptor } from "@/src/lib/shared/ui/Fields";
import { deriveReleaseDateFields } from "@/src/lib/shared/ui/Fields";

export type IOptionsKey =
  | "modes"
  | "genres"
  | "themes"
  | "type"
  | "companies"
  | "game_engines"
  | "player_perspectives"
  | "languages"
  | "status";

export type IFieldKind =
  | "text"
  | "number"
  | "date"
  | "textarea"
  | "toggle"
  | "stringList"
  | "numberList"
  | "objectList"
  | "platforms"
  | "imageList"
  | "coverUpload"
  | "enum"
  | "enumList"
  | "imagePicker";

export interface IFieldDescriptor {
  path: string;
  label: string;
  kind: IFieldKind;
  fields?: IObjectFieldDescriptor[];
  uploadType?: "cover" | "screenshot" | "artwork";
  optionsKey?: IOptionsKey;
  autoCaption?: string;
}

export interface ISectionDescriptor {
  title: string;
  note?: string;
  isDefaultOpen?: boolean;
  fields: IFieldDescriptor[];
}

const SYNC_NOTE =
  "Filled by a sync. Changes here may be overwritten unless isStopParsing is enabled.";

const HLTB_NOTE = `${SYNC_NOTE} Fill "HLTB id" and press "Parse HLTB by id" in the header to link the game to that exact entry; leave it empty to search by name.`;

const VNDB_NOTE = `${SYNC_NOTE} VNDB owns a game that has a VNDB id: the IGDB sync skips it. Save a new VNDB id before pressing "Parse from VNDB" in the header.`;

const IGDB_NOTE = `${SYNC_NOTE} "Parse from IGDB" in the header uses the saved IGDB game id and is not available for a game linked to VNDB.`;

const RELATED_NOTE =
  "MoonCellar game ids. Filled by the IGDB and VNDB syncs, which overwrite manual changes.";

const MULTIPLAYER_FIELDS: IObjectFieldDescriptor[] = [
  { key: "platformId", label: "Platform id", kind: "text" },
  { key: "campaignCoop", label: "Campaign coop", kind: "boolean" },
  { key: "dropIn", label: "Drop in", kind: "boolean" },
  { key: "lanCoop", label: "LAN coop", kind: "boolean" },
  { key: "offlineCoop", label: "Offline coop", kind: "boolean" },
  { key: "offlineCoopMax", label: "Offline coop max", kind: "number" },
  { key: "offlineMax", label: "Offline max", kind: "number" },
  { key: "onlineCoop", label: "Online coop", kind: "boolean" },
  { key: "onlineCoopMax", label: "Online coop max", kind: "number" },
  { key: "onlineMax", label: "Online max", kind: "number" },
  { key: "splitscreen", label: "Splitscreen", kind: "boolean" },
  { key: "splitscreenOnline", label: "Splitscreen online", kind: "boolean" },
];

const AGE_RATING_FIELDS: IObjectFieldDescriptor[] = [
  { key: "organization", label: "Organization", kind: "text" },
  { key: "rating", label: "Rating", kind: "text" },
  { key: "synopsis", label: "Synopsis", kind: "text" },
];

const EXTERNAL_PAGE_FIELDS: IObjectFieldDescriptor[] = [
  { key: "name", label: "Name", kind: "text" },
  { key: "uid", label: "Uid", kind: "text" },
  { key: "url", label: "Url", kind: "text" },
];

const VNDB_RELATION_FIELDS: IObjectFieldDescriptor[] = [
  { key: "vnId", label: "VN id", kind: "text" },
  { key: "relation", label: "Relation", kind: "text" },
];

const RELATED_GAME_FIELDS: [string, string][] = [
  ["dlcs", "DLCs"],
  ["expansions", "Expansions"],
  ["standalone_expansions", "Standalone expansions"],
  ["bundles", "Bundles"],
  ["expanded_games", "Expanded games"],
  ["forks", "Forks"],
  ["ports", "Ports"],
  ["remakes", "Remakes"],
  ["remasters", "Remasters"],
  ["similar_games", "Similar games"],
  ["sequels", "Sequels"],
  ["prequels", "Prequels"],
  ["side_stories", "Side stories"],
  ["parent_stories", "Parent stories"],
  ["same_series", "Same series"],
  ["same_setting", "Same setting"],
  ["shared_characters", "Shared characters"],
  ["alternative_versions", "Alternative versions"],
];

const IGDB_RELATION_FIELDS: [string, string][] = [
  ["dlcs", "DLC ids"],
  ["expansions", "Expansion ids"],
  ["standalone_expansions", "Standalone expansion ids"],
  ["bundles", "Bundle ids"],
  ["expanded_games", "Expanded game ids"],
  ["forks", "Fork ids"],
  ["ports", "Port ids"],
  ["remakes", "Remake ids"],
  ["remasters", "Remaster ids"],
  ["similar_games", "Similar game ids"],
];

const COMPANY_FIELDS: IObjectFieldDescriptor[] = [
  { key: "name", label: "Name", kind: "text", optionsKey: "companies" },
  { key: "developer", label: "Developer", kind: "boolean" },
  { key: "publisher", label: "Publisher", kind: "boolean", defaultValue: true },
  { key: "porting", label: "Porting", kind: "boolean" },
  { key: "supporting", label: "Supporting", kind: "boolean" },
];

const RELEASE_DATE_FIELDS: IObjectFieldDescriptor[] = [
  {
    key: "date",
    label: "Date",
    kind: "date",
    derive: deriveReleaseDateFields,
  },
  { key: "platformId", label: "Platform id", kind: "text" },
  { key: "region", label: "Region", kind: "number" },
];

const RETROACHIEVEMENTS_FIELDS: IObjectFieldDescriptor[] = [
  { key: "gameId", label: "Game id", kind: "number" },
  { key: "consoleId", label: "Console id", kind: "number" },
];

export const GAME_SECTIONS: ISectionDescriptor[] = [
  {
    title: "General",
    isDefaultOpen: true,
    fields: [
      { path: "name", label: "Name", kind: "text" },
      { path: "slug", label: "Slug", kind: "text" },
      {
        path: "alternative_names",
        label: "Alternative names",
        kind: "stringList",
      },
      { path: "versionTitle", label: "Version title", kind: "text" },
      { path: "type", label: "Type", kind: "enum", optionsKey: "type" },
      { path: "status", label: "Status", kind: "enum", optionsKey: "status" },
      { path: "summary", label: "Summary", kind: "textarea" },
      { path: "storyline", label: "Storyline", kind: "textarea" },
      { path: "first_release", label: "First release", kind: "date" },
    ],
  },
  {
    title: "Flags",
    isDefaultOpen: true,
    fields: [
      { path: "isStopParsing", label: "Stop IGDB parsing", kind: "toggle" },
      {
        path: "isStopParsingPictures",
        label: "Stop parsing pictures",
        kind: "toggle",
      },
    ],
  },
  {
    title: "Cover",
    isDefaultOpen: true,
    fields: [
      {
        path: "cover",
        label: "Cover",
        kind: "coverUpload",
        uploadType: "cover",
      },
    ],
  },
  {
    title: "Taxonomy",
    fields: [
      { path: "modes", label: "Modes", kind: "enumList", optionsKey: "modes" },
      { path: "genres", label: "Genres", kind: "enumList", optionsKey: "genres" },
      { path: "keywords", label: "Keywords", kind: "stringList" },
      { path: "themes", label: "Themes", kind: "enumList", optionsKey: "themes" },
      { path: "franchises", label: "Franchises", kind: "stringList" },
      {
        path: "game_engines",
        label: "Game engines",
        kind: "enumList",
        optionsKey: "game_engines",
      },
      {
        path: "player_perspectives",
        label: "Player perspectives",
        kind: "enumList",
        optionsKey: "player_perspectives",
      },
      {
        path: "languages",
        label: "Languages",
        kind: "enumList",
        optionsKey: "languages",
      },
    ],
  },
  {
    title: "Media",
    fields: [
      {
        path: "screenshots",
        label: "Screenshots",
        kind: "imageList",
        uploadType: "screenshot",
      },
      {
        path: "artworks",
        label: "Artworks",
        kind: "imageList",
        uploadType: "artwork",
      },
      { path: "videos", label: "Videos", kind: "stringList" },
      { path: "websites", label: "Websites", kind: "stringList" },
    ],
  },
  {
    title: "Background and banner",
    note: "Pick from the screenshots and artworks above. A picture removed from those lists stops being used and the automatic choice returns.",
    fields: [
      {
        path: "backgroundImage",
        label: "Page background",
        kind: "imagePicker",
        autoCaption: "Random artwork, or a screenshot when there are none",
      },
      {
        path: "bannerImage",
        label: "Hero banner",
        kind: "imagePicker",
        autoCaption: "First artwork, or the first screenshot",
      },
    ],
  },
  {
    title: "Platforms",
    fields: [{ path: "platformIds", label: "Platforms", kind: "platforms" }],
  },
  {
    title: "Companies",
    fields: [
      {
        path: "companies",
        label: "Companies",
        kind: "objectList",
        fields: COMPANY_FIELDS,
      },
    ],
  },
  {
    title: "Release dates",
    fields: [
      {
        path: "release_dates",
        label: "Release dates",
        kind: "objectList",
        fields: RELEASE_DATE_FIELDS,
      },
    ],
  },
  {
    title: "Multiplayer",
    fields: [
      {
        path: "multiplayer_modes",
        label: "Multiplayer",
        kind: "objectList",
        fields: MULTIPLAYER_FIELDS,
      },
    ],
  },
  {
    title: "Age ratings",
    fields: [
      {
        path: "ageRatings",
        label: "Age ratings",
        kind: "objectList",
        fields: AGE_RATING_FIELDS,
      },
    ],
  },
  {
    title: "External pages",
    fields: [
      {
        path: "externalPages",
        label: "External pages",
        kind: "objectList",
        fields: EXTERNAL_PAGE_FIELDS,
      },
    ],
  },
  {
    title: "Related games",
    note: RELATED_NOTE,
    fields: [
      { path: "relatedGames.parent_game", label: "Parent game", kind: "text" },
      ...RELATED_GAME_FIELDS.map(
        ([key, label]): IFieldDescriptor => ({
          path: `relatedGames.${key}`,
          label,
          kind: "stringList",
        })
      ),
    ],
  },
  {
    title: "RetroAchievements",
    note: SYNC_NOTE,
    fields: [
      {
        path: "retroachievements",
        label: "RetroAchievements",
        kind: "objectList",
        fields: RETROACHIEVEMENTS_FIELDS,
      },
    ],
  },
  {
    title: "IGDB",
    note: IGDB_NOTE,
    fields: [
      { path: "igdb.gameId", label: "IGDB game id", kind: "number" },
      { path: "igdb.url", label: "Url", kind: "text" },
      { path: "igdb.status", label: "Status", kind: "number" },
      { path: "igdb.parent_game", label: "Parent game id", kind: "number" },
      {
        path: "igdb.version_parent",
        label: "Version parent id",
        kind: "number",
      },
      { path: "igdb.total_rating", label: "Total rating", kind: "number" },
      {
        path: "igdb.total_rating_count",
        label: "Total rating count",
        kind: "number",
      },
      {
        path: "igdb.aggregated_rating",
        label: "Aggregated rating",
        kind: "number",
      },
      {
        path: "igdb.aggregated_rating_count",
        label: "Aggregated rating count",
        kind: "number",
      },
      { path: "igdb.rating", label: "Rating", kind: "number" },
      { path: "igdb.rating_count", label: "Rating count", kind: "number" },
      { path: "igdb.hypes", label: "Hypes", kind: "number" },
      {
        path: "igdb.screenshotsCount",
        label: "Screenshots count",
        kind: "number",
      },
      { path: "igdb.artworksCount", label: "Artworks count", kind: "number" },
      { path: "igdb.game_type", label: "Game type", kind: "number" },
      { path: "igdb.genres", label: "Genre ids", kind: "numberList" },
      { path: "igdb.keywords", label: "Keyword ids", kind: "numberList" },
      { path: "igdb.themes", label: "Theme ids", kind: "numberList" },
      { path: "igdb.modes", label: "Mode ids", kind: "numberList" },
      { path: "igdb.websites", label: "Website ids", kind: "numberList" },
      {
        path: "igdb.release_dates",
        label: "Release date ids",
        kind: "numberList",
      },
      { path: "igdb.platforms", label: "Platform ids", kind: "numberList" },
      {
        path: "igdb.involved_companies",
        label: "Company ids",
        kind: "numberList",
      },
      { path: "igdb.cover", label: "Cover ids", kind: "numberList" },
      { path: "igdb.screenshots", label: "Screenshot ids", kind: "numberList" },
      { path: "igdb.artworks", label: "Artwork ids", kind: "numberList" },
      { path: "igdb.franchises", label: "Franchise ids", kind: "numberList" },
      { path: "igdb.videos", label: "Video ids", kind: "numberList" },
      {
        path: "igdb.alternative_names",
        label: "Alternative name ids",
        kind: "numberList",
      },
      {
        path: "igdb.game_engines",
        label: "Game engine ids",
        kind: "numberList",
      },
      {
        path: "igdb.player_perspectives",
        label: "Player perspective ids",
        kind: "numberList",
      },
      ...IGDB_RELATION_FIELDS.map(
        ([key, label]): IFieldDescriptor => ({
          path: `igdb.${key}`,
          label,
          kind: "numberList",
        })
      ),
    ],
  },
  {
    title: "VNDB",
    note: VNDB_NOTE,
    fields: [
      { path: "vndb.vnId", label: "VN id", kind: "text" },
      { path: "vndb.lengthMinutes", label: "Length, minutes", kind: "number" },
      { path: "vndb.rating", label: "Rating", kind: "number" },
      { path: "vndb.votecount", label: "Vote count", kind: "number" },
      {
        path: "vndb.relations",
        label: "Relations",
        kind: "objectList",
        fields: VNDB_RELATION_FIELDS,
      },
      { path: "vndb.syncedAt", label: "Synced at", kind: "text" },
    ],
  },
  {
    title: "HLTB",
    note: HLTB_NOTE,
    fields: [
      { path: "hltb.hltbId", label: "HLTB id", kind: "text" },
      { path: "hltb.mainStory", label: "Main story", kind: "number" },
      { path: "hltb.mainExtra", label: "Main + extra", kind: "number" },
      { path: "hltb.completionist", label: "Completionist", kind: "number" },
      { path: "hltb.allStyles", label: "All styles", kind: "number" },
      { path: "hltb.coop", label: "Coop", kind: "number" },
      { path: "hltb.multiplayer", label: "Multiplayer", kind: "number" },
      {
        path: "hltb.mainStoryCount",
        label: "Main story count",
        kind: "number",
      },
      {
        path: "hltb.mainExtraCount",
        label: "Main + extra count",
        kind: "number",
      },
      {
        path: "hltb.completionistCount",
        label: "Completionist count",
        kind: "number",
      },
      {
        path: "hltb.allStylesCount",
        label: "All styles count",
        kind: "number",
      },
      { path: "hltb.coopCount", label: "Coop count", kind: "number" },
      {
        path: "hltb.multiplayerCount",
        label: "Multiplayer count",
        kind: "number",
      },
      { path: "hltb.reviewScore", label: "Review score", kind: "number" },
      { path: "hltb.imageUrl", label: "Image url", kind: "text" },
      { path: "hltb.platforms", label: "Platforms", kind: "stringList" },
      { path: "hltb.releaseYear", label: "Release year", kind: "number" },
      { path: "hltb.similarity", label: "Similarity", kind: "number" },
      { path: "hltb.alias", label: "Alias", kind: "text" },
      { path: "hltb.type", label: "Type", kind: "text" },
      { path: "hltb.sourceName", label: "Source name", kind: "text" },
      { path: "hltb.updatedAt", label: "Updated at", kind: "text" },
    ],
  },
];
