import { Schema, model, type Document, type Model, Types } from "mongoose";

export interface StatsDocument extends Document {
  totalVisits: number;
  groupsCreated: number;
  createdAt: Date;
  updatedAt: Date;
}

interface StatsModel extends Model<StatsDocument> {
  getSingleton(): Promise<StatsDocument>;
  incrementField(
    id: Types.ObjectId,
    field: "totalVisits" | "groupsCreated",
    amount?: number,
  ): Promise<StatsDocument | null>;
}

const statsSchema = new Schema<StatsDocument, StatsModel>(
  {
    totalVisits: { type: Number, default: 0 },
    groupsCreated: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

statsSchema.statics.getSingleton = async function getSingleton() {
  const existing = await this.findOne().exec();

  if (existing) {
    return existing;
  }

  return this.create({ totalVisits: 0, groupsCreated: 0 });
};

statsSchema.statics.incrementField = async function incrementField(
  id,
  field,
  amount = 1,
) {
  return this.findByIdAndUpdate(
    id,
    {
      $inc: {
        [field]: amount,
      },
    },
    { new: true },
  ).exec();
};

const StatsModel = model<StatsDocument, StatsModel>("Stats", statsSchema);

export default StatsModel;
