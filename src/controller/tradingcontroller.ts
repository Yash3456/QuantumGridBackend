import { Request, Response } from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { EnergySource } from "../Models/EnergyListing"; // Adjust path as needed
import { Transaction } from "../Models/Transaction"; // Adjust path as needed

dotenv.config();

// MongoDB model for energies
const Energies = mongoose.model(
  "Energies",
  new mongoose.Schema({
    name: String,
    price: Number,
    marketListed: Boolean,
  })
);

// MongoDB model for trades
const Trades = mongoose.model(
  "Trades",
  new mongoose.Schema({
    userId: String,
    energyId: String,
    quantity: Number,
    totalPrice: Number,
    tradeDate: { type: Date, default: Date.now },
  })
);

// Controller to get all market-listed energies
export const getMarketListedEnergies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const energies = await Energies.find({ marketListed: true });

    res.status(200).json({
      success: true,
      energies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch market-listed energies",
    });
  }
};

export const getTradeDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.trade_id || req.query.trade_id || req.body.trade_id;

    if (!id) {
      res.status(400).json({
        success: false,
        error: "Transaction_id is missing",
      });
    }

    const energies = await Energies.find({ transaction_id: id });

    res.status(200).json({
      success: true,
      energies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch market-listed energies",
    });
  }
};

export class TradeCompletionController {
  // Complete trade and store transaction
  async completeTrade(req: Request, res: Response): Promise<void> {
    try {
      const {
        transaction_id,
        buyer_id,
        seller_id,
        quantity_kwh,
        agreed_price_per_kwh,
        smart_contract_address,
        blockchain_tx_hash,
        region,
        energy_type,
      } = req.body;

      // Validate input
      if (
        !transaction_id ||
        !buyer_id ||
        !seller_id ||
        !quantity_kwh ||
        !agreed_price_per_kwh ||
        !smart_contract_address ||
        !blockchain_tx_hash ||
        !region ||
        !energy_type
      ) {
        res.status(400).json({
          success: false,
          error: "Missing required fields",
        });
        return;
      }

      // Create transaction entry
      const transaction = new Transaction({
        transaction_id,
        buyer_id,
        seller_id,
        quantity_kwh,
        agreed_price_per_kwh,
        trade_status: "completed",
        smart_contract_address,
        blockchain_tx_hash,
        region,
        energy_type,
        payment_status: "paid", // Assuming payment is completed
      });

      await transaction.save();

      // Delete energy listing associated with the seller
      const energyListing = await EnergySource.findOneAndDelete({
        user_id: seller_id,
        energy_listing_id: transaction_id, // Assuming transaction_id matches energy_listing_id
      });

      if (!energyListing) {
        res.status(404).json({
          success: false,
          error: "Energy listing not found or already deleted",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Trade completed successfully",
        transaction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to complete trade",
      });
    }
  }
}

export class TradingHistory {
  // Get all trade details made by the user
  async getUserTrades(req: Request, res: Response): Promise<void> {
    try {
      const { user_id } = req.params || req.body;

      // Validate input
      if (!user_id) {
        res.status(400).json({
          success: false,
          error: "Missing required parameter: user_id",
        });
        return;
      }

      // Fetch trades where the user is either the buyer or the seller
      const trades = await Transaction.find({
        $or: [{ buyer_id: user_id }, { seller_id: user_id }],
      });

      if (!trades || trades.length === 0) {
        res.status(404).json({
          success: false,
          error: "No trades found for the user",
        });
        return;
      }

      res.status(200).json({
        success: true,
        trades,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch trade details",
      });
    }
  }
}

export class Tradingstatusupdation {
  // Update trade status
  async updateTradeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { trade_id } = req.params;
      const { status, reason } = req.body;

      // Validate input
      if (!trade_id || !status) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: trade_id or status",
        });
        return;
      }

      // Validate status value
      const validStatuses = ["initiated", "pending", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: `Invalid status value. Allowed values are: ${validStatuses.join(", ")}`,
        });
        return;
      }

      // Update trade status
      const updatedTrade = await Transaction.findByIdAndUpdate(
        trade_id,
        { trade_status: status, reason },
        { new: true }
      );

      if (!updatedTrade) {
        res.status(404).json({
          success: false,
          error: "Trade not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Trade status updated successfully",
        trade: updatedTrade,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to update trade status",
      });
    }
  }
}
