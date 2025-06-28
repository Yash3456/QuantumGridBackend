import { Request, Response } from "express";
import { EnergySource } from "../Models/EnergyListing"; // Adjust path as needed
import { Transaction } from "../Models/Transaction"; // Adjust path as needed

export const getUserEnergyListings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user_id } = req.params || req.body;

    // Validate input
    if (!user_id) {
      res.status(400).json({
        success: false,
        error: "Missing required parameter: user_id",
      });
      return Promise.resolve();
    }

    // Fetch energy listings for the user
    const energyListings = await EnergySource.find({ user_id });

    if (!energyListings || energyListings.length === 0) {
      res.status(404).json({
        success: false,
        error: "No energy listings found for the user",
      });
      return Promise.resolve();
    }

    res.status(200).json({
      success: true,
      energyListings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch energy listings",
    });
  }
};

export const getAllEnergyListings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch energy listings for the user
    const energyListings = await EnergySource.find({});

    if (!energyListings || energyListings.length === 0) {
      res.status(404).json({
        success: false,
        error: "No energy listings found for the user",
      });
      return Promise.resolve();
    }

    res.status(200).json({
      success: true,
      energyListings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch energy listings",
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

export class TradingController {
  // Create purchase request
  async createPurchaseRequest(req: Request, res: Response): Promise<void> {
    try {
      const {
        quantity_kwh,
        max_price_per_kwh,
        required_from,
        required_until,
        energy_type_preference,
        buyer_id,
      } = req.body;

      // Validate input
      if (
        !quantity_kwh ||
        !max_price_per_kwh ||
        !required_from ||
        !required_until ||
        !buyer_id
      ) {
        res.status(400).json({
          success: false,
          error:
            "Missing required fields: quantity_kwh, max_price_per_kwh, required_from, required_until, or buyer_id",
        });
        return;
      }

      // Fetch matching energy listings
      const query: any = {
        capacity_kw: { $gte: quantity_kwh },
        energy_price: { $lte: max_price_per_kwh },
        source_type: energy_type_preference || { $exists: true },
      };

      const matchingListings = await EnergySource.find(query);

      if (!matchingListings || matchingListings.length === 0) {
        res.status(404).json({
          success: false,
          error: "No matching energy listings found",
        });
        return;
      }

      // Select the best match (e.g., lowest price per kWh)
      const bestMatch = matchingListings.sort(
        (a, b) => Number(a.energy_price) - Number(b.energy_price)
      )[0];

      // Create a transaction
      const transaction = new Transaction({
        transaction_id: `${Date.now()}-${buyer_id}-${bestMatch.energy_listing_id}`, // Generate a unique transaction ID
        buyer_id,
        seller_id: bestMatch.user_id,
        quantity_kwh,
        agreed_price_per_kwh: bestMatch.energy_price,
        trade_status: "completed",
        smart_contract_address: "0x123456789abcdef", // Placeholder for smart contract address
        blockchain_tx_hash: "0xabcdef123456789", // Placeholder for blockchain transaction hash
        region: bestMatch.state,
        energy_type: bestMatch.source_type,
        payment_status: "paid", // Assuming payment is completed
      });

      await transaction.save();

      // Update the energy listing capacity or delete if fully traded
      if (quantity_kwh === bestMatch.capacity_kw) {
        await EnergySource.findByIdAndDelete(bestMatch._id);
      } else {
        bestMatch.capacity_kw = (
          Number(bestMatch.capacity_kw) - quantity_kwh
        ).toString();
        await bestMatch.save();
      }

      res.status(200).json({
        success: true,
        message: "Purchase request completed successfully",
        transaction,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create purchase request",
      });
    }
  }
}
