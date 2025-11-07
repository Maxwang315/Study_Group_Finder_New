import { Document, Schema, Types, model } from "mongoose";

export interface Group {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  university: string;
  createdAt: Date;
  updatedAt: Date;
}

export type GroupDocument = Group & Document;

const GroupSchema = new Schema<GroupDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    university: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

GroupSchema.index({ name: "text", description: "text" });
GroupSchema.index({ university: 1 });

export const GroupModel = model<GroupDocument>("Group", GroupSchema);

export default GroupModel;
