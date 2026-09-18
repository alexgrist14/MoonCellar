import { type S3ClientConfig } from "@aws-sdk/client-s3";

export const S3_FOLDERS = {
  covers: "covers",
  screenshots: "screenshots",
  artworks: "artworks",
  characters: "characters",
  avatars: "avatars",
  backgrounds: "backgrounds",
  comments: "comments",
  common: "common",
} as const;

export type S3Folder = (typeof S3_FOLDERS)[keyof typeof S3_FOLDERS];

export const LEGACY_BUCKET_PREFIX = "mooncellar-";

const DEFAULT_ENDPOINT = "https://sfo3.digitaloceanspaces.com";
const DEFAULT_BUCKET = "mooncellar";
const DEFAULT_CDN_URL = "https://mooncellar.sfo3.cdn.digitaloceanspaces.com";
const SPACES_SIGNING_REGION = "us-east-1";

export const getS3Endpoint = () => process.env.S3_ENDPOINT || DEFAULT_ENDPOINT;

export const getS3Bucket = () => process.env.S3_BUCKET || DEFAULT_BUCKET;

export const getS3CdnUrl = () =>
  (process.env.S3_CDN_URL || DEFAULT_CDN_URL).replace(/\/+$/, "");

export const getS3Config = (): S3ClientConfig => ({
  endpoint: getS3Endpoint(),
  region: SPACES_SIGNING_REGION,
  forcePathStyle: false,
  credentials: {
    accessKeyId: process.env.S3_ID,
    secretAccessKey: process.env.S3_KEY,
  },
});

export const resolveS3Folder = (name?: string): S3Folder | undefined => {
  if (!name) return undefined;

  const candidate = name.startsWith(LEGACY_BUCKET_PREFIX)
    ? name.slice(LEGACY_BUCKET_PREFIX.length)
    : name;

  return (Object.values(S3_FOLDERS) as string[]).includes(candidate)
    ? (candidate as S3Folder)
    : undefined;
};

const LEGACY_S3_URL =
  /^https?:\/\/(?:s3\.regru\.cloud\/mooncellar-([a-z0-9-]+)|mooncellar-([a-z0-9-]+)\.s3\.regru\.cloud)\/(.+)$/i;

export interface IS3ObjectRef {
  folder: S3Folder;
  key: string;
}

export const parseS3ImageUrl = (
  url?: string | null
): IS3ObjectRef | undefined => {
  if (!url) return undefined;

  const cdnPrefix = `${getS3CdnUrl()}/`;

  if (url.startsWith(cdnPrefix)) {
    const [name, ...rest] = url.slice(cdnPrefix.length).split("/");
    const folder = resolveS3Folder(name);

    return folder && rest.length ? { folder, key: rest.join("/") } : undefined;
  }

  const legacy = url.match(LEGACY_S3_URL);

  if (!legacy) return undefined;

  const folder = resolveS3Folder(legacy[1] ?? legacy[2]);

  return folder ? { folder, key: legacy[3] } : undefined;
};
