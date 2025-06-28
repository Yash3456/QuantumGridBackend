import mongoose, { Schema, Document } from "mongoose";

export interface PriceModel extends Document {
  user_id: string;
  status: "pending" | "verified" | "suspended";
  maximum_price_per_kwh: number;
  minimum_price_per_kwh: number;
  updatedAt: Date;
  Location_update: {
    type: "Point";
    coordinates: [number, number];
  };
  state: string;
}

const PriceLimitSchema = new Schema<PriceModel>({
  user_id: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["pending", "verified", "suspended"],
    default: "pending",
  },
  maximum_price_per_kwh: {
    type: Number,
    required: true,
    default: 8,
  },
  minimum_price_per_kwh: {
    type: Number,
    required: true,
    default: 5,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  Location_update: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  state: {
    type: String,
    required: true,
  },
});

export const PriceLimit = mongoose.model<PriceModel>(
  "PriceLimit",
  PriceLimitSchema
);
