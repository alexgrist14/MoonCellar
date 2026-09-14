import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { cleanupOpenApiDoc } from "nestjs-zod";
import { AppModule } from "../src/app.module";

const app = await NestFactory.create(AppModule, {
  preview: true,
  logger: ["error"],
  abortOnError: false,
});
const document = cleanupOpenApiDoc(
  SwaggerModule.createDocument(app, new DocumentBuilder().build())
);
await app.close();

console.log(`Boot check passed: ${Object.keys(document.paths).length} routes`);
