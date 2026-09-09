import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import { json } from "body-parser";
import { rootDir } from "./shared/constants";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { Logger } from "nestjs-pino";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set("trust proxy", true);

  app.useStaticAssets(`${rootDir}/uploads/photos`);
  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: [
      ...(process.env.LOCAL_CONNECTION?.split(",") || []),
      "https://mooncellar.space",
    ],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(json({ limit: "2mb" }));
  app.useLogger(app.get(Logger));

  const config = new DocumentBuilder()
    .setTitle("MoonCellar API")
    .setDescription("API for MoonCellar server")
    .setVersion("1.0")
    .addCookieAuth("accessMoonToken")
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      docExpansion: "none",
      withCredentials: true,
      persistAuthorization: true,
    },
  });
  await app.listen(3228);
}
bootstrap();
