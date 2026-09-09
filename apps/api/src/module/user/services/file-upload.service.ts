import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
  S3Client,
  PutObjectCommandInput,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
} from "@aws-sdk/client-s3";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { getS3Config, mimeToExt } from "src/shared/constants";
import {
  IGetFileRequest,
  IGetFileResponse,
} from "src/shared/zod/schemas/files.schema";

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly s3Client = new S3Client(getS3Config());

  async uploadObject(
    Body: PutObjectCommandInput["Body"],
    key: string,
    bucketName: string
  ) {
    try {
      return await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body,
        })
      );
    } catch (err) {
      this.logger.error(err, `Failed to upload object: ${key}`);
      throw err;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    key: string,
    bucketName: string,
    mimetype?: string,
    isPrivate?: boolean
  ) {
    try {
      if (!file) return;

      const ext = mimeToExt[file.mimetype || mimetype] || "";

      return await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key + `.${ext}`,
          Body: file.buffer,
          ContentType: file.mimetype || mimetype,
          ACL: isPrivate ? "private" : "public-read",
        })
      );
    } catch (err) {
      this.logger.error(err, `Failed to upload file: ${key}`);
      throw err;
    }
  }

  async getBuckets() {
    try {
      return await this.s3Client.send(new ListBucketsCommand());
    } catch (err) {
      this.logger.error(err, `Failed to get buckets`);
      throw err;
    }
  }

  async getAllKeys(
    bucketName: string,
    options?: {
      callback?: (keys: string[]) => Promise<unknown>;
      prefix?: string;
    }
  ) {
    try {
      let keys = [];
      let continuationToken = null;

      do {
        const params: ListObjectsV2CommandInput = {
          Bucket: bucketName,
          ContinuationToken: continuationToken,
          Prefix: options?.prefix,
        };

        try {
          const response = await this.s3Client.send(
            new ListObjectsV2Command(params)
          );

          keys = !!response.Contents?.length
            ? keys.concat(response.Contents.map((item) => item.Key))
            : [];
          !!keys?.length && (await options?.callback?.(keys));
          continuationToken = response.NextContinuationToken;
        } catch (err) {
          console.error("Error fetching keys:", err);
          throw err;
        }
      } while (continuationToken);

      return keys;
    } catch (err) {
      this.logger.error(err, `Failed to get all keys: ${bucketName}`);
      throw err;
    }
  }

  async clearBucket(bucketName: string) {
    try {
      const size = 1000;
      const keys = await this.getAllKeys(bucketName);
      if (!keys?.length) return;

      for (let i = 0; i <= keys.length; i += size) {
        const slice = keys.slice(i, i + size);
        await this.deleteFiles(slice, bucketName);
        console.log(`Removed keys from ${i} to ${i + size}`);
      }

      return keys;
    } catch (err) {
      this.logger.error(err, `Failed to clear bucket: ${bucketName}`);
      throw err;
    }
  }

  async getFile(params: IGetFileRequest): Promise<IGetFileResponse> {
    try {
      const { bucketName, key, contentTo } = params;

      const item = await this.s3Client
        .send(new GetObjectCommand({ Bucket: bucketName, Key: key }))
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
      this.logger.error(err, `Failed to get file: ${params.key}`);
      throw err;
    }
  }

  async deleteFile(key: string, bucketName: string) {
    try {
      return await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        })
      );
    } catch (err) {
      this.logger.error(err, `Failed to delete file: ${key}`);
      throw err;
    }
  }

  async deleteFiles(keys: string[], bucketName: string) {
    try {
      return await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: keys.map((key) => ({ Key: key })) },
        })
      );
    } catch (err) {
      this.logger.error(err, `Failed to delete files: ${keys}`);
      throw err;
    }
  }

  async removeDuplicates(bucketName: string) {
    try {
      const etagMap = new Map<string, string[]>();

      let continuationToken: string | undefined = undefined;

      do {
        const params: ListObjectsV2CommandInput = {
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        };

        const response = await this.s3Client.send(
          new ListObjectsV2Command(params)
        );

        if (response.Contents) {
          for (const item of response.Contents) {
            if (item.ETag && item.Key) {
              const etag = item.ETag.replace(/"/g, "");
              if (!etagMap.has(etag)) {
                etagMap.set(etag, []);
              }
              etagMap.get(etag)!.push(item.Key);
            }
          }
        }

        continuationToken = response.NextContinuationToken;
      } while (continuationToken);

      const keysToDelete: string[] = [];

      for (const keys of etagMap.values()) {
        if (keys.length > 1) {
          keysToDelete.push(...keys.slice(1));
        }
      }

      if (keysToDelete.length > 0) {
        await this.deleteFiles(keysToDelete, bucketName);
      }
    } catch (err) {
      this.logger.error(err, `Failed to remove duplicates: ${bucketName}`);
      throw err;
    }
  }
}
