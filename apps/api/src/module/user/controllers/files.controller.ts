import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import mongoose from "mongoose";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FileService } from "../services/file-upload.service";
import {
  FileOrphansService,
  ORPHAN_SCAN_FOLDERS,
} from "../services/file-orphans.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { GetFileRequestDto } from "../../../shared/zod/dto/files.dto";
import { resolveS3Folder, S3_FOLDERS, type S3Folder } from "../../../shared/s3";

const parseNumber = (name: string, value?: string) => {
  if (value === undefined) return undefined;

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new BadRequestException(`${name} must be a number`);
  }

  return parsed;
};

const COMMENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const COMMENT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

@ApiTags("Files Controller")
@Controller("file")
export class FilesController {
  constructor(
    private readonly fileService: FileService,
    private readonly fileOrphansService: FileOrphansService
  ) {}

  private folderOf(bucketName?: string): S3Folder {
    const folder = resolveS3Folder(bucketName);

    if (!folder) {
      throw new BadRequestException(
        `Unknown storage folder: ${bucketName}. Allowed: ${Object.values(S3_FOLDERS).join(", ")}`
      );
    }

    return folder;
  }

  @Get("/")
  @ApiResponse({ status: 200, description: "Success" })
  async getFile(@Query() dto: GetFileRequestDto) {
    return this.fileService.getFile(
      this.folderOf(dto.bucketName),
      dto.key,
      dto.contentTo
    );
  }

  @Post("/comment-image")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"))
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: COMMENT_IMAGE_MAX_BYTES } })
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @ApiResponse({ status: 201, description: "Public URL of the stored image" })
  async uploadCommentImage(
    @Req() req: { user?: { _id: mongoose.Types.ObjectId } },
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) throw new BadRequestException("No file uploaded");

    if (!COMMENT_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported image type: ${file.mimetype}. Allowed: ${COMMENT_IMAGE_MIME_TYPES.join(", ")}`
      );
    }

    return this.fileService.uploadPublicImage(
      file,
      `${req.user._id.toString()}/${new mongoose.Types.ObjectId().toString()}`,
      S3_FOLDERS.comments
    );
  }

  @Post("/object")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiResponse({ status: 201, description: "Cool!" })
  async uploadObject(
    @Query("key") key: string,
    @Query("bucketName") bucketName: string,
    @Query("object") object: string
  ) {
    return this.fileService.uploadObject(
      object,
      key,
      this.folderOf(bucketName)
    );
  }

  @Post("/")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiResponse({ status: 201, description: "Key the file was stored under" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async uploadFile(
    @Query("key") key: string,
    @Query("bucketName") bucketName: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.fileService.uploadFile(file, key, this.folderOf(bucketName));
  }

  @Delete("/")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async deleteFile(
    @Query("key") key: string,
    @Query("bucketName") bucketName: string
  ) {
    return await this.fileService.deleteFile(key, this.folderOf(bucketName));
  }

  @Delete("/multi")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async deleteFiles(
    @Query("keys") keys: string[] | string,
    @Query("bucketName") bucketName: string
  ) {
    return await this.fileService.deleteFiles(
      [keys].flat().filter(Boolean),
      this.folderOf(bucketName)
    );
  }

  @Get("/buckets")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Storage folders in the bucket" })
  async getBuckets() {
    return this.fileService.getFolders();
  }

  @Get("/bucket-keys")
  @ApiResponse({ status: 200, description: "Success" })
  @ApiQuery({ name: "prefix", required: false })
  async getBucketKeys(
    @Query("bucketName") bucketName: string,
    @Query("prefix") prefix: string | undefined
  ) {
    return await this.fileService.getAllKeys(this.folderOf(bucketName), {
      prefix,
    });
  }

  @Delete("/clear-bucket")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async clearBucket(@Query("bucketName") bucketName: string) {
    void this.fileService
      .clearFolder(this.folderOf(bucketName))
      .catch(() => undefined);
  }

  @Delete("/remove-duplicates")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async removeDuplicates(@Query("bucketName") bucketName: string) {
    void this.fileService
      .removeDuplicates(this.folderOf(bucketName))
      .catch(() => undefined);
  }

  @Post("/orphans")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiOperation({
    summary:
      "Start a background scan for stored files that nothing in the database references any more",
  })
  @ApiResponse({ status: 201, description: "Scan started" })
  @ApiQuery({
    name: "apply",
    required: false,
    type: Boolean,
    description:
      "Delete the orphans; without it the scan only counts them. Irreversible",
  })
  @ApiQuery({
    name: "folders",
    required: false,
    description: `Comma separated folders to scan (default ${ORPHAN_SCAN_FOLDERS.join(", ")})`,
  })
  @ApiQuery({
    name: "prefix",
    required: false,
    description:
      "Only list keys under this prefix inside each folder; references are still read from the whole database",
  })
  @ApiQuery({
    name: "minAgeDays",
    required: false,
    type: Number,
    description:
      "Never touch an object modified within this many days, so an upload racing the scan is safe (default 7)",
  })
  @ApiQuery({
    name: "maxDeleteRatio",
    required: false,
    type: Number,
    description:
      "Refuse to delete when orphans exceed this share of a folder (default 0.2)",
  })
  @ApiQuery({
    name: "sampleLimit",
    required: false,
    type: Number,
    description: "How many orphan keys to keep in the report (default 50)",
  })
  startOrphansScan(
    @Query("apply") apply?: string,
    @Query("folders") folders?: string,
    @Query("prefix") prefix?: string,
    @Query("minAgeDays") minAgeDays?: string,
    @Query("maxDeleteRatio") maxDeleteRatio?: string,
    @Query("sampleLimit") sampleLimit?: string
  ) {
    return this.fileOrphansService.start({
      apply: apply === "true",
      folders: folders
        ?.split(",")
        .map((folder) => this.folderOf(folder.trim())),
      prefix,
      minAgeDays: parseNumber("minAgeDays", minAgeDays),
      maxDeleteRatio: parseNumber("maxDeleteRatio", maxDeleteRatio),
      sampleLimit: parseNumber("sampleLimit", sampleLimit),
    });
  }

  @Get("/orphans")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Read the state of the last orphan scan" })
  @ApiResponse({ status: 200, description: "Current scan state" })
  getOrphansScan() {
    return this.fileOrphansService.getState();
  }

  @Delete("/orphans")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Ask the running orphan scan to stop" })
  @ApiResponse({ status: 200, description: "Stop requested" })
  stopOrphansScan() {
    return this.fileOrphansService.stop();
  }
}
