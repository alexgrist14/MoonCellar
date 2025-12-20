import { z } from "zod";
import { transformBoolean } from "./utils";

export const ParseImagesSchema = z.object({
  parseType: z.enum(["covers", "artworks", "screenshots"]),
  limit: z.coerce.number().optional(),
  timeout: z.coerce.number().optional(),
  isParseExisted: transformBoolean(),
});

export type IParseImagesRequest = z.infer<typeof ParseImagesSchema>;
