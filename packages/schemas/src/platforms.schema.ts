import { z } from "zod";

export const FEATURED_PLATFORM_SLUGS = [
  "win",
  "ps5",
  "ps4--1",
  "switch",
  "series-x-s",
  "ps2",
  "xbox360",
  "snes",
  "nes",
  "genesis-slash-megadrive",
];

export const PlatformFamilySchema = z.object({
  name: z.string(),
  slug: z.string(),
});

export const PlatformSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  family: PlatformFamilySchema,
  logo: z.string(),
  generation: z.number(),
  igdbId: z.number(),
  raId: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type IPlatform = z.infer<typeof PlatformSchema>;
export type IPlatformFamily = z.infer<typeof PlatformFamilySchema>;
