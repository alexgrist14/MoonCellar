import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { SteamGamesService } from "../src/module/steam/services/steam-games.service";

const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error"] });
const service = app.get(SteamGamesService);
console.log("SYNC", JSON.stringify(await service.sync()));
console.log("VERIFY", JSON.stringify(await service.verifyConflicts({ limit: 5000 })));
await app.close();
process.exit(0);
