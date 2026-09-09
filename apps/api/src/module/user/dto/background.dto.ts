import { ApiProperty } from "@nestjs/swagger";
import { IsUrl } from "class-validator";

export class BackgroundDto {
  @IsUrl()
  @ApiProperty({ example: "Background link" })
  url: string;
}
