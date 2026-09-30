import { z } from "zod";

export const IMAGE_PROVIDERS = ["openai", "recraft"] as const;

export const IMAGE_MODELS: Record<(typeof IMAGE_PROVIDERS)[number], string[]> =
  {
    openai: [
      "gpt-image-2.5-flare",
      "gpt-image-2.5-sunburst",
      "gpt-image-1.5",
      "gpt-image-1-mini",
    ],
    recraft: [
      "recraftv4_1",
      "recraftv4_1_pro",
      "recraftv4_1_utility",
      "recraftv4_1_flash",
      "recraftv4",
      "recraftv4_pro",
      "recraftv3",
    ],
  };

export const IMAGE_PROMPT_MAX_LENGTH = 4000;
export const IMAGE_DATA_URL_MAX_LENGTH = 1_900_000;
export const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp);base64,/;
export const IMAGE_ELEMENTS_MAX = 8;

const ImageDataUrlSchema = z
  .string()
  .max(IMAGE_DATA_URL_MAX_LENGTH)
  .regex(IMAGE_DATA_URL_PATTERN);

export const ImageProviderSchema = z.enum(IMAGE_PROVIDERS);

export const GenerateImageRequestSchema = z.object({
  provider: ImageProviderSchema.describe("Image generation provider"),
  model: z.string().describe("Model of the provider, from IMAGE_MODELS"),
  prompt: z
    .string()
    .trim()
    .min(1)
    .max(IMAGE_PROMPT_MAX_LENGTH)
    .describe("Description of the image"),
  referenceDataUrl: ImageDataUrlSchema.optional().describe(
    "Image the result must follow, for elements of a set: OpenAI edits it, Recraft takes its style"
  ),
  keyColor: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional()
    .describe(
      "Flat background colour the element is drawn on, keyed out in the browser afterwards"
    ),
});

export const GenerateImageResponseSchema = z.object({
  dataUrl: z.string().describe("Generated image as a base64 data URL"),
});

export const SaveGeneratedImageRequestSchema = GenerateImageRequestSchema.omit({
  referenceDataUrl: true,
  keyColor: true,
}).extend({
  dataUrl: ImageDataUrlSchema.describe(
    "PNG, JPEG or WebP image as a base64 data URL"
  ),
});

export const ImageElementSchema = z.object({
  name: z.string().describe("Short name of the element"),
  prompt: z.string().describe("Prompt that isolates the element"),
});

export const SuggestImageElementsRequestSchema = z.object({
  prompt: GenerateImageRequestSchema.shape.prompt,
  dataUrl: ImageDataUrlSchema.describe("The image to split into elements"),
});

export const SuggestImageElementsResponseSchema = z.object({
  elements: ImageElementSchema.array().max(IMAGE_ELEMENTS_MAX),
});

export const GeneratedImageSchema = z.object({
  _id: z.string().describe("Saved image id"),
  url: z.string().describe("Public URL in the Space"),
  prompt: z.string().describe("Prompt the image was generated from"),
  provider: ImageProviderSchema.describe("Provider"),
  model: z.string().describe("Model"),
  createdAt: z.string().describe("When the image was saved"),
});

export type IImageProvider = z.infer<typeof ImageProviderSchema>;
export type IGenerateImageRequest = z.infer<typeof GenerateImageRequestSchema>;
export type IGenerateImageResponse = z.infer<
  typeof GenerateImageResponseSchema
>;
export type ISaveGeneratedImageRequest = z.infer<
  typeof SaveGeneratedImageRequestSchema
>;
export type IGeneratedImage = z.infer<typeof GeneratedImageSchema>;
export type IImageElement = z.infer<typeof ImageElementSchema>;
export type ISuggestImageElementsRequest = z.infer<
  typeof SuggestImageElementsRequestSchema
>;
export type ISuggestImageElementsResponse = z.infer<
  typeof SuggestImageElementsResponseSchema
>;
