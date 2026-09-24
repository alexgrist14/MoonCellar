import { z } from "zod";
import { CharacterSchema } from "./characters.schema";
import { AgeRatingSchema, RelatedGamesSchema } from "./games.schema";
import { ObjectIdSchema } from "./utils";

export const CONTENT_REQUEST_SCREENSHOTS_MAX = 20;
export const CONTENT_REQUESTS_PAGE_SIZE = 20;

export const ContentRequestKindSchema = z.enum(["game", "character"]);
export const ContentRequestActionSchema = z.enum(["add", "update"]);
export const ContentRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "withdrawn",
]);

const LinkSchema = z
  .url({ protocol: /^https?$/, error: "Use an http(s) link" })
  .max(2048);

const text = (max: number) => z.string().trim().min(1).max(max);

const textList = (max: number, count: number) => text(max).array().max(count);

const RequestCompanySchema = z.object({
  name: text(120),
  developer: z.boolean().default(false),
  publisher: z.boolean().default(false),
  porting: z.boolean().default(false),
  supporting: z.boolean().default(false),
});

const RequestReleaseDateSchema = z.object({
  date: z.number().int(),
  platformId: ObjectIdSchema,
  region: z.number().int().min(1).max(20).optional(),
});

const RequestMultiplayerModeSchema = z.object({
  platformId: ObjectIdSchema.optional(),
  campaignCoop: z.boolean().optional(),
  dropIn: z.boolean().optional(),
  lanCoop: z.boolean().optional(),
  offlineCoop: z.boolean().optional(),
  offlineCoopMax: z.number().int().min(0).max(1000).optional(),
  offlineMax: z.number().int().min(0).max(1000).optional(),
  onlineCoop: z.boolean().optional(),
  onlineCoopMax: z.number().int().min(0).max(1000).optional(),
  onlineMax: z.number().int().min(0).max(1000).optional(),
  splitscreen: z.boolean().optional(),
  splitscreenOnline: z.boolean().optional(),
});

const RequestExternalPageSchema = z.object({
  name: text(80).optional(),
  uid: text(200),
  url: z
    .url({ protocol: /^https?$/, error: "Use an http(s) link" })
    .max(2048)
    .optional(),
});

const RequestRelatedGamesSchema = z.partialRecord(
  RelatedGamesSchema.keyof().exclude(["parent_game"]),
  ObjectIdSchema.array().max(50)
);

export const GameRequestPayloadSchema = z
  .object({
    name: text(200),
    alternative_names: textList(200, 20),
    versionTitle: text(200),
    type: text(60),
    status: text(60),
    first_release: z.number().int(),
    release_dates: RequestReleaseDateSchema.array().max(60),
    platformIds: ObjectIdSchema.array().max(60),
    genres: textList(80, 20),
    modes: textList(80, 10),
    themes: textList(80, 20),
    keywords: textList(80, 100),
    franchises: textList(120, 10),
    game_engines: textList(120, 10),
    player_perspectives: textList(80, 10),
    languages: textList(80, 60),
    companies: RequestCompanySchema.array().max(30),
    developer: text(120),
    publisher: text(120),
    summary: text(5000),
    storyline: text(5000),
    multiplayer_modes: RequestMultiplayerModeSchema.array().max(20),
    ageRatings: AgeRatingSchema.array().max(20),
    websites: LinkSchema.array().max(20),
    externalPages: RequestExternalPageSchema.array().max(20),
    videos: LinkSchema.array().max(20),
    relatedGames: RequestRelatedGamesSchema,
    parentGameId: ObjectIdSchema,
    cover: LinkSchema,
    screenshots: LinkSchema.array().max(CONTENT_REQUEST_SCREENSHOTS_MAX),
    artworks: LinkSchema.array().max(CONTENT_REQUEST_SCREENSHOTS_MAX),
    igdbId: z.number().int().positive(),
    vndbId: z.string().trim().regex(/^v\d+$/, "A VNDB id looks like v17"),
    hltbId: z.string().trim().regex(/^\d+$/, "An HLTB id is a number"),
    retroachievements: z
      .object({
        gameId: z.number().int().positive(),
        consoleId: z.number().int().positive(),
      })
      .array()
      .max(10),
  })
  .partial()
  .strict();

export const CharacterRequestPayloadSchema = z
  .object({
    name: text(200),
    akas: text(200).array().max(20),
    gameIds: ObjectIdSchema.array().max(60),
    gender: text(40),
    species: text(80),
    countryName: text(120),
    description: text(5000),
    mugShot: LinkSchema,
  })
  .partial()
  .strict();

export const GAME_REQUEST_FIELDS = GameRequestPayloadSchema.keyof().options;
export const CHARACTER_REQUEST_FIELDS =
  CharacterRequestPayloadSchema.keyof().options;

const requestBase = {
  action: ContentRequestActionSchema,
  targetId: ObjectIdSchema.optional(),
  sources: LinkSchema.array().max(10).default([]),
  note: z.string().trim().max(2000).optional(),
};

export const CreateContentRequestSchema = z
  .discriminatedUnion("kind", [
    z.object({
      kind: z.literal("game"),
      ...requestBase,
      payload: GameRequestPayloadSchema,
    }),
    z.object({
      kind: z.literal("character"),
      ...requestBase,
      payload: CharacterRequestPayloadSchema,
    }),
  ])
  .superRefine((request, ctx) => {
    if (request.action === "update" && !request.targetId) {
      ctx.addIssue({
        code: "custom",
        path: ["targetId"],
        message: "Pick what to update",
      });
    }

    const hasSourceId =
      request.kind === "game" &&
      (!!request.payload.igdbId || !!request.payload.vndbId);

    if (request.action === "add" && !request.payload.name && !hasSourceId) {
      ctx.addIssue({
        code: "custom",
        path: ["payload", "name"],
        message: "A name, an IGDB id or a VNDB id is required",
      });
    }

    if (!Object.keys(request.payload).length) {
      ctx.addIssue({
        code: "custom",
        path: ["payload"],
        message: "Fill at least one field",
      });
    }
  });

export const ContentRequestSchema = z.object({
  _id: z.string(),
  kind: ContentRequestKindSchema,
  action: ContentRequestActionSchema,
  status: ContentRequestStatusSchema,
  targetId: z.string().nullable().optional(),
  targetName: z.string().nullable().optional(),
  targetSlug: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()),
  sources: z.string().array(),
  note: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  appliedFields: z.string().array().optional(),
  userId: z.string(),
  userName: z.string().nullable().optional(),
  resultId: z.string().nullable().optional(),
  resultSlug: z.string().nullable().optional(),
  createdAt: z.string(),
  decidedAt: z.string().nullable().optional(),
});

export const ContentRequestDetailSchema = ContentRequestSchema.extend({
  current: z.record(z.string(), z.unknown()).nullable(),
});

export const GetContentRequestsSchema = z.object({
  status: ContentRequestStatusSchema.optional(),
  kind: ContentRequestKindSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(CONTENT_REQUESTS_PAGE_SIZE),
});

export const GetContentRequestsResponseSchema = z.object({
  results: ContentRequestSchema.array(),
  total: z.number(),
  pending: z.number(),
});

export const DecideContentRequestSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    fields: z.string().array().optional(),
    reason: z.string().trim().max(1000).optional(),
    lockSync: z.boolean().optional(),
  })
  .refine((body) => body.decision === "approve" || !!body.reason, {
    path: ["reason"],
    message: "A reason is required to reject",
  });

export const DecideContentRequestResponseSchema = z.object({
  request: ContentRequestSchema,
  failedImages: z.string().array(),
  warnings: z.string().array(),
});

export const CharacterSourceSchema = z.enum(["igdb", "vndb", "manual"]);

export const GetAdminCharactersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  source: CharacterSourceSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce.number().int().min(1).max(100).default(30),
});

export const GetAdminCharactersResponseSchema = z.object({
  results: CharacterSchema.array(),
  total: z.number(),
});

export const SaveCharacterRequestSchema = z
  .object({
    name: text(200),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and dashes only")
      .max(200),
    akas: text(200).array().max(20),
    gender: z.string().trim().max(40).nullable(),
    species: z.string().trim().max(80).nullable(),
    countryName: z.string().trim().max(120).nullable(),
    description: z.string().trim().max(10000).nullable(),
    gameIds: ObjectIdSchema.array().max(200),
    mugShotUrl: LinkSchema,
  })
  .partial();

export type IContentRequestKind = z.infer<typeof ContentRequestKindSchema>;
export type IContentRequestAction = z.infer<typeof ContentRequestActionSchema>;
export type IContentRequestStatus = z.infer<typeof ContentRequestStatusSchema>;
export type IGameRequestPayload = z.infer<typeof GameRequestPayloadSchema>;
export type ICharacterRequestPayload = z.infer<
  typeof CharacterRequestPayloadSchema
>;
export type ICreateContentRequest = z.input<typeof CreateContentRequestSchema>;
export type ICreateContentRequestParsed = z.output<
  typeof CreateContentRequestSchema
>;
export type IContentRequest = z.infer<typeof ContentRequestSchema>;
export type IContentRequestDetail = z.infer<typeof ContentRequestDetailSchema>;
export type IGetContentRequests = z.input<typeof GetContentRequestsSchema>;
export type IGetContentRequestsQuery = z.output<typeof GetContentRequestsSchema>;
export type IGetContentRequestsResponse = z.infer<
  typeof GetContentRequestsResponseSchema
>;
export type IDecideContentRequest = z.infer<typeof DecideContentRequestSchema>;
export type IDecideContentRequestResponse = z.infer<
  typeof DecideContentRequestResponseSchema
>;
export type ICharacterSource = z.infer<typeof CharacterSourceSchema>;
export type IGetAdminCharacters = z.input<typeof GetAdminCharactersSchema>;
export type IGetAdminCharactersQuery = z.output<typeof GetAdminCharactersSchema>;
export type IGetAdminCharactersResponse = z.infer<
  typeof GetAdminCharactersResponseSchema
>;
export type ISaveCharacterRequest = z.infer<typeof SaveCharacterRequestSchema>;
