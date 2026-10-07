import { createZodDto } from "nestjs-zod";
import {
  AddGauntletHistorySchema,
  GauntletHistoryGameParamsSchema,
  GetGauntletHistorySchema,
} from "@mooncellar/schemas";

export class GetGauntletHistoryDto extends createZodDto(
  GetGauntletHistorySchema
) {}
export class AddGauntletHistoryDto extends createZodDto(
  AddGauntletHistorySchema
) {}
export class GauntletHistoryGameParamsDto extends createZodDto(
  GauntletHistoryGameParamsSchema
) {}
