// EnergySource.ts
import mongoose, { Schema, Document } from "mongoose";
import { PriceLimit } from "./PriceLimit"; // adjust path as needed

export interface IEnergySource extends Document {
  energy_listing_id: string;
  source_id: string;
  user_id: string;
  source_type: "solar" | "wind" | "hydro";
  capacity_kw: string;
  efficiency_rating: number;
  energy_price: string;
  status: String;
  meter_id?: string;
  blockchain_hash: string;
  state: string;
  source_location: {
    type: "Point";
    coordinates: [number, number];
  };
}

const EnergySourceSchema = new Schema<IEnergySource>({
  energy_listing_id: { type: String, required: true, unique: true },
  source_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  source_type: {
    type: String,
    enum: ["solar", "wind", "hydro"],
    required: true,
  },
  capacity_kw: { type: String, required: true },
  efficiency_rating: { type: Number },
  status: { type: String, required: true },
  meter_id: { type: String },
  blockchain_hash: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  state: { type: String, required: true }, // <- NEW field for state
  energy_price: {
    type: String,
    required: true,
  },
  source_location: {
    type: {
      type: String,
      enum: ["Point"],
      required: false,
    },
    coordinates: {
      type: [Number],
      required: false,
    },
  },
});

// ✅ Middleware: validate energy_price based on state's price limits
EnergySourceSchema.pre("save", async function (next) {
  const source = this as IEnergySource;

  try {
    const limit = await PriceLimit.findOne({ state: source.state });

    if (!limit) {
      return next(new Error(`No price limit found for state: ${source.state}`));
    }

    const { minimum_price_per_kwh, maximum_price_per_kwh } = limit;

    if (
      parseFloat(source.energy_price) < minimum_price_per_kwh ||
      parseFloat(source.energy_price) > maximum_price_per_kwh
    ) {
      return next(
        new Error(
          `Energy price must be between ₹${minimum_price_per_kwh} and ₹${maximum_price_per_kwh} for ${source.state}`
        )
      );
    }

    next();
  } catch (error) {
    next(error as mongoose.CallbackError);
  }
});

export const EnergySource = mongoose.model<IEnergySource>(
  "EnergySource",
  EnergySourceSchema
);
