import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Character, type CharacterDocument } from "../schemas/character.schema";
import { Game, type GameDocument } from "../schemas/game.schema";
import {
  type IGetAdminCharactersQuery,
  type IGetAdminCharactersResponse,
  type IGetCharacterBySlugRequest,
  type IGetCharactersRequest,
  type ISaveCharacterRequest,
} from "@mooncellar/schemas";
import { FileService } from "../../user/services/file-upload.service";
import { S3_FOLDERS } from "../../../shared/s3";
import { uniqueSlug } from "../../../shared/utils";
import { escapeRegExp } from "../../collections/utils/collections.utils";

const DEFAULT_CHARACTERS_TAKE = 50;

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);
  constructor(
    @InjectModel(Character.name)
    private Characters: Model<CharacterDocument>,
    @InjectModel(Game.name)
    private Games: Model<GameDocument>,
    private fileService: FileService
  ) {}

  async getCharacters(params: IGetCharactersRequest) {
    try {
      const { gameId, ids, search, take, page } = params;

      const filter: mongoose.FilterQuery<CharacterDocument> = {};

      if (gameId) {
        filter.gameIds = new mongoose.Types.ObjectId(gameId);
      }

      if (ids) {
        const list = Array.isArray(ids) ? ids : [ids];
        filter._id = {
          $in: list.map((id) => new mongoose.Types.ObjectId(id)),
        };
      }

      if (search) {
        filter.name = { $regex: escapeRegExp(search), $options: "i" };
      }

      const limit = take || DEFAULT_CHARACTERS_TAKE;

      return await this.Characters.find(filter)
        .sort({ name: 1 })
        .skip(((page || 1) - 1) * limit)
        .limit(limit);
    } catch (err) {
      this.logger.error(err, "Failed to get characters");
      throw err;
    }
  }

  async getCharacterBySlug({ slug }: IGetCharacterBySlugRequest) {
    try {
      const character = await this.Characters.findOne({ slug });

      if (!character) {
        throw new NotFoundException(`Character not found: ${slug}`);
      }

      return character;
    } catch (err) {
      this.logger.error(err, `Failed to get character: ${slug}`);
      throw err;
    }
  }

  async getAdminCharacters({
    search,
    source,
    page,
    take,
  }: IGetAdminCharactersQuery): Promise<IGetAdminCharactersResponse> {
    const filter: mongoose.FilterQuery<CharacterDocument> = {};

    if (search) {
      const pattern = { $regex: escapeRegExp(search), $options: "i" };
      filter.$or = [{ name: pattern }, { akas: pattern }];
    }

    if (source === "igdb") filter["igdb.characterId"] = { $exists: true };
    if (source === "vndb") filter["vndb.characterId"] = { $exists: true };
    if (source === "manual") {
      filter["igdb.characterId"] = { $exists: false };
      filter["vndb.characterId"] = { $exists: false };
    }

    const [results, total] = await Promise.all([
      this.Characters.find(filter)
        .sort(search ? { name: 1 } : { updatedAt: -1 })
        .skip((page - 1) * take)
        .limit(take)
        .lean(),
      this.Characters.countDocuments(filter),
    ]);

    return { results, total } as unknown as IGetAdminCharactersResponse;
  }

  async saveCharacter(id: string | undefined, dto: ISaveCharacterRequest) {
    const existing = id ? await this.findCharacter(id) : null;
    const characterId = existing?._id ?? new mongoose.Types.ObjectId();
    const { mugShotUrl, gameIds, slug, ...fields } = dto;

    if (!existing && !fields.name) {
      throw new BadRequestException("A name is required");
    }

    const set: Record<string, unknown> = {
      ...fields,
      updatedAt: new Date().toISOString(),
    };

    if (slug && slug !== existing?.slug) {
      if (await this.Characters.exists({ slug, _id: { $ne: characterId } })) {
        throw new ConflictException(`Slug already exists: ${slug}`);
      }

      set.slug = slug;
    }

    if (!existing && !set.slug) {
      set.slug = await uniqueSlug(
        (candidate) => this.Characters.exists({ slug: candidate }),
        fields.name!
      );
    }

    if (gameIds) {
      const found = await this.Games.find({
        _id: { $in: gameIds.map((gameId) => new mongoose.Types.ObjectId(gameId)) },
      })
        .select("_id")
        .lean();

      set.gameIds = found.map(({ _id }) => _id);
    }

    if (mugShotUrl) {
      try {
        set.mugShot = await this.fileService.uploadRemoteImage(
          mugShotUrl,
          `${characterId}/${new mongoose.Types.ObjectId()}`,
          S3_FOLDERS.characters
        );
      } catch (err) {
        throw new BadRequestException(
          `Could not use the portrait link: ${(err as Error).message}`
        );
      }
    }

    if (existing) {
      await this.Characters.updateOne({ _id: characterId }, { $set: set });
    } else {
      await this.Characters.create({
        _id: characterId,
        akas: [],
        gameIds: [],
        createdAt: set.updatedAt,
        ...set,
      });
    }

    return this.Characters.findById(characterId).lean();
  }

  async uploadCharacterImage(id: string, file: Express.Multer.File) {
    const character = await this.findCharacter(id);
    const mugShot = await this.fileService.uploadPublicImage(
      file,
      `${character._id}/${new mongoose.Types.ObjectId()}`,
      S3_FOLDERS.characters
    );

    await this.Characters.updateOne(
      { _id: character._id },
      { $set: { mugShot, updatedAt: new Date().toISOString() } }
    );

    return { mugShot };
  }

  async deleteCharacter(id: string) {
    const character = await this.findCharacter(id);

    await Promise.all([
      this.Characters.deleteOne({ _id: character._id }),
      this.Games.updateMany(
        { characters: character._id },
        { $pull: { characters: character._id } }
      ),
    ]);

    return { success: true };
  }

  private async findCharacter(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid character id: ${id}`);
    }

    const character = await this.Characters.findById(id).lean();

    if (!character) throw new NotFoundException(`Character not found: ${id}`);

    return character;
  }
}
