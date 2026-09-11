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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { FileService } from "../services/file-upload.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { RolesGuard } from "../../roles/roles.guard";
import { Roles } from "../../roles/roles.decorator";
import { GetFileRequestDto } from "../../../shared/zod/dto/files.dto";
import {
  resolveS3Folder,
  S3_FOLDERS,
  S3Folder,
} from "../../../shared/s3";

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
  constructor(private readonly fileService: FileService) {}

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
    return this.fileService.uploadObject(object, key, this.folderOf(bucketName));
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
}
