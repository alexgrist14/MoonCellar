import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Character, CharacterDocument } from "../schemas/character.schema";
import {
  IGetCharacterBySlugRequest,
  IGetCharactersRequest,
} from "src/shared/zod/schemas/characters.schema";

const DEFAULT_CHARACTERS_TAKE = 50;

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);
  constructor(
    @InjectModel(Character.name)
    private Characters: Model<CharacterDocument>
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
        filter.name = { $regex: search, $options: "i" };
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
}
