import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
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
import { RolesGuard } from "src/module/roles/roles.guard";
import { Roles } from "src/module/roles/roles.decorator";
import { GetFileRequestDto } from "src/shared/zod/dto/files.dto";

@ApiTags("Files Controller")
@Controller("file")
export class FilesController {
  constructor(private readonly fileService: FileService) {}

  @Get("/")
  @ApiResponse({ status: 200, description: "Success" })
  async getFile(@Query() dto: GetFileRequestDto) {
    return this.fileService.getFile(dto);
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
    return this.fileService.uploadObject(object, key, bucketName);
  }

  @Post("/")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiResponse({ status: 201, description: "WhatsUp Niggga" })
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
    return this.fileService.uploadFile(file, key, bucketName);
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
    return await this.fileService.deleteFile(key, bucketName);
  }

  @Delete("/multi")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async deleteFiles(
    @Query("keys") keys: string[],
    @Query("bucketName") bucketName: string
  ) {
    return await this.fileService.deleteFiles(keys, bucketName);
  }

  @Get("/buckets")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async getBuckets() {
    return await this.fileService.getBuckets();
  }

  @Get("/bucket-keys")
  @ApiResponse({ status: 200, description: "Success" })
  @ApiQuery({ name: "prefix", required: false })
  async getBucketKeys(
    @Query("bucketName") bucketName: string,
    @Query("prefix") prefix: string | undefined
  ) {
    return await this.fileService.getAllKeys(bucketName, { prefix });
  }

  @Delete("/clear-bucket")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async clearBucket(@Query("bucketName") bucketName: string) {
    this.fileService.clearBucket(bucketName);
  }

  @Delete("/remove-duplicates")
  @ApiCookieAuth()
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles("admin")
  @ApiResponse({ status: 200, description: "Success" })
  async removeDuplicates(@Query("bucketName") bucketName: string) {
    this.fileService.removeDuplicates(bucketName);
  }
}
