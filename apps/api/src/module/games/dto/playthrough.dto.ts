import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import mongoose from "mongoose";
import { CategoriesType } from "src/module/user/types/actions";

export class GetPlaythroughsDTO {
  @ApiProperty()
  userId: string;
  @ApiPropertyOptional()
  gameId: string;
  @ApiPropertyOptional()
  category: CategoriesType;
}

export class SavePlaythroughDTO {
  @ApiProperty()
  userId: mongoose.Types.ObjectId;
  @ApiProperty()
  category: CategoriesType;
  @ApiProperty()
  date: string;
  @ApiPropertyOptional()
  time: number;
  @ApiPropertyOptional()
  comment: string;
  @ApiProperty()
  gameId: number;
  @ApiProperty()
  platformId: number;
  @ApiProperty()
  IGDBReleaseDateId: number;
  @ApiPropertyOptional()
  isMastered: boolean;
}

export class UpdatePlaythroughDTO {
  @ApiPropertyOptional()
  category: CategoriesType;
  @ApiPropertyOptional()
  date: string;
  @ApiPropertyOptional()
  time: number;
  @ApiPropertyOptional()
  comment: string;
  @ApiPropertyOptional()
  platformId: number;
  @ApiPropertyOptional()
  IGDBReleaseDateId: number;
  @ApiPropertyOptional()
  isMastered: boolean;
}
