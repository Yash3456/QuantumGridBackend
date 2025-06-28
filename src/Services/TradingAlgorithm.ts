import { Request, Response } from "express";
import { EnergySource } from "../Models/EnergyListing"; // Adjust path as needed
import { PriceLimit } from "../Models/PriceLimit"; // Adjust path as needed

export class EnergyListingController {
  // Get all energy listings
  async getEnergyListings(req: Request, res: Response): Promise<void> {
    try {
      const { state, source_type, min_price, max_price } = req.query;

      const query: any = {};
      if (state) query.state = state;
      if (source_type) query.source_type = source_type;
      if (min_price)
        query.energy_price = { $gte: parseFloat(min_price as string) };
      if (max_price)
        query.energy_price = {
          ...query.energy_price,
          $lte: parseFloat(max_price as string),
        };

      const energyListings = await EnergySource.find(query);

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
  }

  // Create a new energy listing
  async createEnergyListing(req: Request, res: Response): Promise<void> {
    try {
      const {
        energy_listing_id,
        source_id,
        user_id,
        source_type,
        capacity_kw,
        efficiency_rating,
        energy_price,
        status,
        meter_id,
        blockchain_hash,
        state,
        source_location,
      } = req.body;

      // Validate price limits for the state
      const limit = await PriceLimit.findOne({ state });
      if (!limit) {
        res.status(400).json({
          success: false,
          error: `No price limit found for state: ${state}`,
        });
        return;
      }

      const { minimum_price_per_kwh, maximum_price_per_kwh } = limit;
      if (
        energy_price < minimum_price_per_kwh ||
        energy_price > maximum_price_per_kwh
      ) {
        res.status(400).json({
          success: false,
          error: `Energy price must be between ₹${minimum_price_per_kwh} and ₹${maximum_price_per_kwh} for ${state}`,
        });
        return;
      }

      // Create a new energy listing
      const energyListing = new EnergySource({
        energy_listing_id,
        source_id,
        user_id,
        source_type,
        capacity_kw,
        efficiency_rating,
        energy_price,
        status,
        meter_id,
        blockchain_hash,
        state,
        source_location,
      });

      await energyListing.save();

      res.status(201).json({
        success: true,
        message: "Energy listing created successfully",
        energyListing,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create energy listing",
      });
    }
  }

  // Update an energy listing
  async updateEnergyListing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate price limits if energy_price is being updated
      if (updates.energy_price && updates.state) {
        const limit = await PriceLimit.findOne({ state: updates.state });
        if (!limit) {
          res.status(400).json({
            success: false,
            error: `No price limit found for state: ${updates.state}`,
          });
          return;
        }

        const { minimum_price_per_kwh, maximum_price_per_kwh } = limit;
        if (
          updates.energy_price < minimum_price_per_kwh ||
          updates.energy_price > maximum_price_per_kwh
        ) {
          res.status(400).json({
            success: false,
            error: `Energy price must be between ₹${minimum_price_per_kwh} and ₹${maximum_price_per_kwh} for ${updates.state}`,
          });
          return;
        }
      }

      const energyListing = await EnergySource.findByIdAndUpdate(id, updates, {
        new: true,
      });
      if (!energyListing) {
        res.status(404).json({
          success: false,
          error: "Energy listing not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Energy listing updated successfully",
        energyListing,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to update energy listing",
      });
    }
  }

  // Delete an energy listing
  async deleteEnergyListing(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const energyListing = await EnergySource.findByIdAndDelete(id);
      if (!energyListing) {
        res.status(404).json({
          success: false,
          error: "Energy listing not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Energy listing deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to delete energy listing",
      });
    }
  }
}
