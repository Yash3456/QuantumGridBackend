import { Request, Response } from "express";
import { EnergySource } from "../Models/EnergyListing"; // Adjust path as needed

// Fetch all energy listings
export const fetchAllEnergyListings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const listings = await EnergySource.find({});
    res.status(200).json({
      success: true,
      data: listings,
    });
  } catch (error) {
    console.error("Error fetching energy listings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch energy listings",
    });
  }
};

// Fetch a specific energy listing by ID
export const fetchEnergyListingById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate energy_listing_id
    if (!id) {
      res.status(400).json({
        success: false,
        error: "Missing required parameter: energy_listing_id",
      });
      return;
    }

    const listing = await EnergySource.findOne({ energy_listing_id: id });

    if (!listing) {
      res.status(404).json({
        success: false,
        error: "Energy listing not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    console.error("Error fetching energy listing by energy_listing_id:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch energy listing",
    });
  }
};
