import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Max, Min } from "class-validator";

export class AddGameRatingDto {
  @IsNotEmpty()
  @ApiProperty({ example: 131913 })
  game: number;
  @IsNotEmpty()
  @Min(1)
  @Max(10)
  @ApiProperty({ example: 9 })
  rating: number;
}
