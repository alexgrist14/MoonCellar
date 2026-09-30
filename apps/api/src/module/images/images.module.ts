import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { FileService } from "../user/services/file-upload.service";
import { ImagesController } from "./images.controller";
import { ImagesService } from "./images.service";
import {
  GeneratedImage,
  GeneratedImageSchema,
} from "./schemas/generated-image.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GeneratedImage.name, schema: GeneratedImageSchema },
    ]),
  ],
  controllers: [ImagesController],
  providers: [ImagesService, FileService],
})
export class ImagesModule {}
