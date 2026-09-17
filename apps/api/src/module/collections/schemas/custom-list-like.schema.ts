import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: "customlistlikes",
})
export class CustomListLike {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomList",
    required: true,
  })
  listId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  userId: mongoose.Types.ObjectId;
}

export const CustomListLikeDatabaseSchema =
  SchemaFactory.createForClass(CustomListLike);

CustomListLikeDatabaseSchema.index({ listId: 1, userId: 1 }, { unique: true });
CustomListLikeDatabaseSchema.index({ userId: 1, listId: 1 });
