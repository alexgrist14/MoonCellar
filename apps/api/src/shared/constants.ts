import { S3ClientConfig } from "@aws-sdk/client-s3";
import { dirname, join } from "path";

export const rootDir = join(dirname(process.argv[1]), "..");

export const ACCESS_TOKEN = "accessMoonToken";
export const REFRESH_TOKEN = "refreshMoonToken";

export const accessExpire = 7 * 24 * 60 * 60 * 1000;
export const refreshExpire = 30 * 24 * 60 * 60 * 1000;

export const RA_MAIN_USER_NAME = "alexgrist14";

export const FRONT_URL = process.env.FRONT_URL || "https://mooncellar.space";
export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || "74a6b85cd7164d77a0cccb5baae3d563";

export const getS3Config = (): S3ClientConfig => ({
  endpoint: process.env.S3_HOST,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ID,
    secretAccessKey: process.env.S3_KEY,
  },
});

export const mimeToExt = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
  'video/mp4': 'mp4',
  'audio/mpeg': 'mp3',
};
