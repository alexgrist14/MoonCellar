import { z } from "zod";

export const CharacterIGDBSchema = z.object({
  characterId: z.number(),
  games: z.number().array().optional(),
  mug_shot: z.number().nullable().optional(),
  character_gender: z.number().nullable().optional(),
  character_species: z.number().nullable().optional(),
  url: z.string().nullable().optional(),
  checksum: z.string().nullable().optional(),
});

export const CharacterVndbSchema = z.object({
  characterId: z.string(),
  vns: z.string().array(),
  image: z.string().nullable().optional(),
});

export const CharacterTraitSchema = z.object({
  group: z.string(),
  name: z.string(),
  isSpoiler: z.boolean(),
});

export const CharacterSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  akas: z.string().array().optional(),
  description: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  species: z.string().nullable().optional(),
  countryName: z.string().nullable().optional(),
  mugShot: z.string().nullable().optional(),
  isExplicitImage: z.boolean().optional(),
  traits: CharacterTraitSchema.array().optional(),
  gameIds: z.string().array().optional(),
  igdb: CharacterIGDBSchema.optional(),
  vndb: CharacterVndbSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const GetCharacterBySlugSchema = z.object({
  slug: z.string(),
});

export const GetCharactersRequestSchema = z.object({
  gameId: z
    .string()
    .describe("Return only characters appearing in this game")
    .optional(),
  ids: z.string().array().or(z.string()).describe("Character id(s)").optional(),
  search: z.string().describe("Search query for character name").optional(),
  take: z.coerce
    .number()
    .min(1)
    .max(500)
    .describe("Amount of characters to return")
    .default(50)
    .optional(),
  page: z.coerce.number().min(1).describe("Page number").default(1).optional(),
});

export const GetCharactersResponseSchema = CharacterSchema.array();

export type ICharacterIGDBField = z.infer<typeof CharacterIGDBSchema>;
export type ICharacterVndbField = z.infer<typeof CharacterVndbSchema>;
export type ICharacterTrait = z.infer<typeof CharacterTraitSchema>;
export type ICharacterResponse = z.infer<typeof CharacterSchema>;
export type IGetCharactersRequest = z.infer<typeof GetCharactersRequestSchema>;
export type IGetCharacterBySlugRequest = z.infer<
  typeof GetCharacterBySlugSchema
>;
export type IGetCharactersResponse = z.infer<
  typeof GetCharactersResponseSchema
>;
