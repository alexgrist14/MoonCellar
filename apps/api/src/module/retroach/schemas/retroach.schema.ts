import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class RAGame {
  @Prop()
  _id: number;
  @Prop()
  title: string;
  @Prop({ ref: "RAConsoles" })
  consoleId: number;
  @Prop()
  consoleName: string;
  @Prop()
  imageIcon: string;
  @Prop()
  numAchievements: number;
}

export const RASchema = SchemaFactory.createForClass(RAGame);
