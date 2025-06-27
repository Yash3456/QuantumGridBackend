// src/models/Transaction.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  transaction_id: string;
  buyer_id: string;
  seller_id: string;
  quantity_kwh: number;
  agreed_price_per_kwh: number;
  trade_status: "initiated" | "pending" | "completed" | "cancelled";
  smart_contract_address: string;
  blockchain_tx_hash: string;
  region: string;
  energy_type: "solar" | "wind" | "hydro" | "other";
  payment_status: "unpaid" | "partial" | "paid" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transaction_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    buyer_id: {
      type: String,
      required: true,
      trim: true,
      index: true, // ✅ Index for faster lookup
    },
    seller_id: {
      type: String,
      required: true,
      trim: true,
      index: true, // ✅ Index for faster lookup
    },
    quantity_kwh: {
      type: Number,
      required: true,
      min: 0,
    },
    agreed_price_per_kwh: {
      type: Number,
      required: true,
      min: 0,
    },
    trade_status: {
      type: String,
      enum: ["initiated", "pending", "completed", "cancelled"],
      default: "initiated",
    },
    smart_contract_address: {
      type: String,
      required: true,
      trim: true,
    },
    blockchain_tx_hash: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    energy_type: {
      type: String,
      enum: ["solar", "wind", "hydro", "other"],
      required: true,
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "failed"],
      default: "unpaid",
    },
  },
  {
    timestamps: true,
  }
);

export const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
