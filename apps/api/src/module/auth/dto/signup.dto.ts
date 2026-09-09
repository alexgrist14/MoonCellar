import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: "alexgrist" })
  readonly userName: string;
  @IsNotEmpty()
  @IsEmail({}, { message: "Please enter correct email" })
  @ApiProperty({ example: "example@gmail.com" })
  readonly email: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({ example: "123456" })
  readonly password: string;
}
