import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountModule } from "../account/account.module";
import {
  StorageBucket,
  StorageBucketSchema,
} from "./schemas/storage-bucket.schema";
import { StorageFile, StorageFileSchema } from "./schemas/storage-file.schema";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";

@Module({
  imports: [
    AccountModule,
    MongooseModule.forFeature([
      { name: StorageFile.name, schema: StorageFileSchema },
      { name: StorageBucket.name, schema: StorageBucketSchema },
    ]),
  ],
  controllers: [StorageController],
  providers: [StorageService],
})
export class StorageModule {}
