import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { IGetFileRequest, IGetFileResponse } from "@mooncellar/schemas";
import { mimeToExt } from "../../../shared/constants";
import {
  getS3Bucket,
  getS3CdnUrl,
  getS3Config,
  S3_FOLDERS,
  S3Folder,
} from "../../../shared/s3";

const DELETE_BATCH_SIZE = 1000;

interface IStoredObject {
  key: string;
  etag?: string;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly s3Client = new S3Client(getS3Config());
  private readonly bucket = getS3Bucket();

  private toKey(folder: S3Folder, key: string) {
    return `${folder}/${key.replace(/^\/+/, "")}`;
  }

  getPublicUrl(folder: S3Folder, key: string) {
    return `${getS3CdnUrl()}/${this.toKey(folder, key)}`;
  }

  getFolders(): S3Folder[] {
    return Object.values(S3_FOLDERS);
  }

  async uploadObject(
    Body: PutObjectCommandInput["Body"],
    key: string,
    folder: S3Folder
  ) {
    try {
      return await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.toKey(folder, key),
          Body,
        })
      );
    } catch (err) {
      this.logger.error(err, `Failed to upload object: ${folder}/${key}`);
      throw err;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    key: string,
    folder: S3Folder,
    mimetype?: string,
    isPrivate?: boolean
  ): Promise<string | undefined> {
    try {
      if (!file) return undefined;

      const contentType = file.mimetype || mimetype;
      const ext = mimeToExt[contentType];
      const storedKey = ext ? `${key}.${ext}` : key;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.toKey(folder, storedKey),
          Body: file.buffer,
          ContentType: contentType,
          ACL: isPrivate ? "private" : "public-read",
        })
      );

      return storedKey;
    } catch (err) {
      this.logger.error(err, `Failed to upload file: ${folder}/${key}`);
      throw err;
    }
  }

  async uploadPublicImage(
    file: Express.Multer.File,
    key: string,
    folder: S3Folder
  ) {
    if (!mimeToExt[file.mimetype]) {
      throw new BadRequestException(`Unsupported image type: ${file.mimetype}`);
    }

    const storedKey = await this.uploadFile(file, key, folder);

    if (!storedKey) throw new BadRequestException("No file uploaded");

    return this.getPublicUrl(folder, storedKey);
  }

  private async listObjects(
    folder: S3Folder,
    prefix = ""
  ): Promise<IStoredObject[]> {
    const folderPrefix = this.toKey(folder, "");
    const items: IStoredObject[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: this.toKey(folder, prefix),
          ContinuationToken: continuationToken,
        })
      );

      for (const item of response.Contents ?? []) {
        if (!item.Key?.startsWith(folderPrefix)) continue;

        items.push({
          key: item.Key.slice(folderPrefix.length),
          etag: item.ETag?.replace(/"/g, ""),
        });
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return items;
  }

  async getAllKeys(folder: S3Folder, options?: { prefix?: string }) {
    try {
      const items = await this.listObjects(folder, options?.prefix);

      return items.map((item) => item.key);
    } catch (err) {
      this.logger.error(err, `Failed to get all keys: ${folder}`);
      throw err;
    }
  }

  async clearFolder(folder: S3Folder) {
    try {
      const keys = await this.getAllKeys(folder);

      await this.deleteFiles(keys, folder);

      return keys;
    } catch (err) {
      this.logger.error(err, `Failed to clear folder: ${folder}`);
      throw err;
    }
  }

  async getFile(
    folder: S3Folder,
    key: string,
    contentTo?: IGetFileRequest["contentTo"]
  ): Promise<IGetFileResponse> {
    try {
      const item = await this.s3Client
        .send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: this.toKey(folder, key),
          })
        )
        .catch((err) => {
          throw new NotFoundException(err.Code);
        });

      return {
        etag: item.ETag,
        checksum: item.ChecksumSHA256,
        metadata: item.Metadata,
        modifiedAt: item.LastModified.toISOString(),
        type: item.ContentType,
        content:
          contentTo === "byteArray"
            ? await item.Body.transformToByteArray()
            : contentTo === "stream"
              ? item.Body.transformToWebStream()
              : await item.Body.transformToString(),
      };
    } catch (err) {
      this.logger.error(err, `Failed to get file: ${folder}/${key}`);
      throw err;
    }
  }

  async deleteFile(key: string, folder: S3Folder) {
    try {
      return await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.toKey(folder, key),
        })
      );
    } catch (err) {
      this.logger.error(err, `Failed to delete file: ${folder}/${key}`);
      throw err;
    }
  }

  async deleteFiles(keys: string[], folder: S3Folder) {
    try {
      const results = [];

      for (let i = 0; i < keys.length; i += DELETE_BATCH_SIZE) {
        const batch = keys.slice(i, i + DELETE_BATCH_SIZE);

        results.push(
          await this.s3Client.send(
            new DeleteObjectsCommand({
              Bucket: this.bucket,
              Delete: {
                Objects: batch.map((key) => ({ Key: this.toKey(folder, key) })),
              },
            })
          )
        );
      }

      return results;
    } catch (err) {
      this.logger.error(err, `Failed to delete files in ${folder}: ${keys}`);
      throw err;
    }
  }

  async removeDuplicates(folder: S3Folder) {
    try {
      const seen = new Set<string>();
      const duplicates: string[] = [];

      for (const { key, etag } of await this.listObjects(folder)) {
        if (!etag) continue;

        if (seen.has(etag)) {
          duplicates.push(key);
        } else {
          seen.add(etag);
        }
      }

      await this.deleteFiles(duplicates, folder);

      return duplicates;
    } catch (err) {
      this.logger.error(err, `Failed to remove duplicates: ${folder}`);
      throw err;
    }
  }
}
