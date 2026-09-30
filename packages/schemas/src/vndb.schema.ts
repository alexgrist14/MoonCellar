import { z } from "zod";

export const VndbParseResponseSchema = z.object({
  slug: z.string(),
  status: z.enum(["updated", "unchanged", "failed"]),
  message: z.string(),
});

export type IVndbParseResponse = z.infer<typeof VndbParseResponseSchema>;
