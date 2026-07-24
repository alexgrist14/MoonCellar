import { IObjectFieldDescriptor } from "../fields/ObjectListField";

export type IOptionsKey =
  | "modes"
  | "genres"
  | "themes"
  | "type"
  | "companies";

export type IFieldKind =
  | "text"
  | "number"
  | "textarea"
  | "toggle"
  | "stringList"
  | "numberList"
  | "objectList"
  | "platforms"
  | "imageList"
  | "coverUpload"
  | "enum"
  | "enumList";

export interface IFieldDescriptor {
  path: string;
  label: string;
  kind: IFieldKind;
  fields?: IObjectFieldDescriptor[];
  uploadType?: "cover" | "screenshot" | "artwork";
  optionsKey?: IOptionsKey;
}

export interface ISectionDescriptor {
  title: string;
  note?: string;
  isDefaultOpen?: boolean;
  fields: IFieldDescriptor[];
}

const SYNC_NOTE =
  "Filled by a sync. Changes here may be overwritten unless isStopParsing is enabled.";

const COMPANY_FIELDS: IObjectFieldDescriptor[] = [
  { key: "name", label: "Name", kind: "text", optionsKey: "companies" },
  { key: "developer", label: "Developer", kind: "boolean" },
  { key: "publisher", label: "Publisher", kind: "boolean", defaultValue: true },
  { key: "porting", label: "Porting", kind: "boolean" },
  { key: "supporting", label: "Supporting", kind: "boolean" },
];

const RELEASE_DATE_FIELDS: IObjectFieldDescriptor[] = [
  { key: "date", label: "Date (unix)", kind: "number" },
  { key: "human", label: "Human", kind: "text" },
  { key: "month", label: "Month", kind: "number" },
  { key: "year", label: "Year", kind: "number" },
  { key: "platformId", label: "Platform id", kind: "text" },
  { key: "region", label: "Region", kind: "text" },
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
      { path: "type", label: "Type", kind: "enum", optionsKey: "type" },
      { path: "summary", label: "Summary", kind: "textarea" },
      { path: "storyline", label: "Storyline", kind: "textarea" },
      { path: "first_release", label: "First release (unix)", kind: "number" },
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
    title: "Ratings",
    note: SYNC_NOTE,
    fields: [
      { path: "rating", label: "Rating", kind: "number" },
      { path: "ratingCount", label: "Rating count", kind: "number" },
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
    note: SYNC_NOTE,
    fields: [
      { path: "igdb.gameId", label: "IGDB game id", kind: "number" },
      { path: "igdb.total_rating", label: "Total rating", kind: "number" },
      {
        path: "igdb.total_rating_count",
        label: "Total rating count",
        kind: "number",
      },
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
    ],
  },
  {
    title: "HLTB",
    note: SYNC_NOTE,
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
