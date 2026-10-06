import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  DEFAULT_STEAM_LIBRARY_ORDER,
  DEFAULT_STEAM_LIBRARY_SORT,
  type IGetSteamLibraryRequest,
  type IGetSteamLibraryResponse,
  type ISteamProgress,
} from "@mooncellar/schemas";
import { User } from "../../user/schemas/user.schema";
import {
  type ISteamLibraryEntry,
  SteamLibrary,
} from "../schemas/steam-library.schema";
import { CustomListsService } from "../../collections/services/custom-lists.service";
import { sortSteamLibrary } from "../utils/steam-library-sort.utils";

@Injectable()
export class SteamLibraryService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(SteamLibrary.name)
    private readonly libraries: Model<SteamLibrary>,
    private readonly lists: CustomListsService
  ) {}

  private async getLegacyLibrary(
    userId: mongoose.Types.ObjectId,
    progress: ISteamProgress[]
  ): Promise<ISteamLibraryEntry[]> {
    const withProgress = progress.flatMap(({ appId, gameId }) =>
      gameId
        ? [{ appId, gameId: new mongoose.Types.ObjectId(gameId), playtime: 0 }]
        : []
    );
    const known = new Set(withProgress.map(({ gameId }) => String(gameId)));
    const fromList = (
      await this.lists.getSourceListGameIds(userId, "steam")
    ).flatMap((gameId) =>
      known.has(String(gameId)) ? [] : [{ appId: 0, gameId, playtime: 0 }]
    );

    return [...withProgress, ...fromList];
  }

  async getLibrary({
    userName,
    sortBy = DEFAULT_STEAM_LIBRARY_SORT,
    sortOrder = DEFAULT_STEAM_LIBRARY_ORDER,
    filters,
  }: IGetSteamLibraryRequest): Promise<IGetSteamLibraryResponse> {
    const user = await this.users
      .findOne({ userName })
      .select("_id steam.achievements")
      .lean();

    if (!user) throw new NotFoundException("User not found");

    const library = await this.libraries
      .findOne({ userId: user._id })
      .select("games")
      .lean();
    const progress = new Map(
      (user.steam?.achievements ?? []).map((entry) => [entry.appId, entry])
    );
    const owned = library
      ? library.games
      : await this.getLegacyLibrary(user._id, [...progress.values()]);
    const gameIds = owned.map(({ gameId }) => gameId);
    const matching = await this.lists.findMatchingGames(gameIds, filters);
    const rows = owned
      .map(({ appId, gameId, playtime }, index) => {
        const entry = progress.get(appId);

        return {
          gameId: String(gameId),
          appId,
          playtime,
          unlocked: entry?.unlocked ?? null,
          total: entry?.total ?? null,
          masteredAt: entry?.masteredAt ?? null,
          position: index + 1,
        };
      })
      .filter(({ gameId }) => !matching || matching.has(gameId));
    const keys =
      sortBy === "name" || sortBy === "release" || sortBy === "rating"
        ? await this.lists.getSortKeys(gameIds, sortBy)
        : undefined;

    return {
      games: sortSteamLibrary(rows, sortBy, sortOrder, keys).map(
        ({ position: _position, ...game }) => game
      ),
      total: owned.length,
    };
  }
}
