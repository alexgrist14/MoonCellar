import z from "zod";

export const GetFileRequestSchema = z.object({
  key: z.string(),
  bucketName: z.string(),
  contentTo: z
    .enum(["byteArray", "stream", "string"])
    .default("string")
    .optional(),
});

export const GetFileResponseSchema = z.object({
  etag: z.string(),
  checksum: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  modifiedAt: z.string().optional(),
  type: z.string().optional(),
  content: z
    .union([
      z.string(),
      z.instanceof(Uint8Array<ArrayBufferLike>),
      z.instanceof(ReadableStream),
    ])
    .optional(),
});

export type IGetFileRequest = z.infer<typeof GetFileRequestSchema>;
export type IGetFileResponse = z.infer<typeof GetFileResponseSchema>;
