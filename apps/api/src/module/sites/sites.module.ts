import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SitesController } from "./sites.controller";
import { SitesService } from "./sites.service";
import { SiteSession, SiteSessionSchema } from "./schemas/site-session.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SiteSession.name, schema: SiteSessionSchema },
    ]),
  ],
  controllers: [SitesController],
  providers: [SitesService],
})
export class SitesModule {}
