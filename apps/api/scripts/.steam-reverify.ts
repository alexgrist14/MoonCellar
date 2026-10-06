import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { SteamGamesService } from "../src/module/steam/services/steam-games.service";

const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error"] });
const r = await app.get(SteamGamesService).verifyConflicts({ limit: 5000, includeVerified: true });
console.log("RESULT", JSON.stringify(r));
await app.close();
process.exit(0);
