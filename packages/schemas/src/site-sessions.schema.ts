import { z } from "zod";

export const SITE_DOMAIN_PATTERN = /^(?=.{3,253}$)([a-z0-9-]+\.)+[a-z]{2,}$/;

export const SaveSiteSessionRequestSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SITE_DOMAIN_PATTERN, "A domain such as f95zone.to")
    .describe("Domain the settings apply to, subdomains included"),
  cookie: z
    .string()
    .trim()
    .max(8000)
    .optional()
    .describe(
      "Cookie header value; omit or leave empty to keep the stored one"
    ),
  userAgent: z.string().trim().max(500).nullable().optional(),
  referer: z.string().trim().url().max(500).nullable().optional(),
});

export const SiteSessionSchema = z.object({
  _id: z.string(),
  domain: z.string(),
  hasCookie: z
    .boolean()
    .describe("A cookie is stored; its value is never returned"),
  userAgent: z.string().nullable(),
  referer: z.string().nullable(),
  updatedAt: z.string(),
});

export const TestSiteSessionResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string().describe("Page title and size, or the error"),
});

export type ISaveSiteSessionRequest = z.input<
  typeof SaveSiteSessionRequestSchema
>;
export type ISiteSession = z.infer<typeof SiteSessionSchema>;
export type ITestSiteSessionResponse = z.infer<
  typeof TestSiteSessionResponseSchema
>;
