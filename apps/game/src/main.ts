import { NestFactory } from "@nestjs/core";
import { type NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { getCorsOrigins } from "./shared/cors";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.set("trust proxy", true);
  app.enableCors({ origin: getCorsOrigins() });
  app.useLogger(app.get(Logger));

  const config = new DocumentBuilder()
    .setTitle("MoonCellar Game API")
    .setDescription("Online service for the MoonCellar game ports")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: { docExpansion: "none" },
  });

  await app.listen(Number(process.env.PORT) || 3229);
}
bootstrap();
