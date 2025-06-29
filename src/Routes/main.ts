// src/routes/route.ts
import express, { Request, Response } from "express";
import mongoose from "mongoose";
// Import individual route modules
import OTPRoutes from "./Authentication";
import { upload, uploadImagesAndSaveUrls } from "../Services/DocumentService";
import TradingRoutes from "./Trading";
import { createDummySources, Updatingtoken } from "../DummyData/dummydata";
import { EnergySource } from "../Models/EnergyListing";
import { Transaction } from "../Models/Transaction";
import { createDummyTransactions } from "../DummyData/DummyTransactions";
import AnalyticsRoutes from "./Analytics";
import { insertDummyPriceLimits } from "../DummyData/DummyPricing";
import {
  fetchAllEnergyListings,
  fetchEnergyListingById,
} from "../DummyData/MongoData";

// Main router
const router = express.Router();

// Prefix routes
// router.use("/energy", energyRoutes);
// router.use("/users", userRoutes);
// router.use("/transactions", transactionRoutes);
router.use("/otp", OTPRoutes);
router.post(
  "/upload",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
  ]),
  uploadImagesAndSaveUrls
);
router.use("/trading", TradingRoutes);

router.get("/metadata", fetchAllEnergyListings);
router.get("/metadata/:id", fetchEnergyListingById);
router.put("/metadata/update-token", Updatingtoken);

router.use("/analytics", AnalyticsRoutes);

router.patch("/priceupdate", async (req: Request, res: Response) => {});

router.get("/getdummy", async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const dummySources = createDummySources();
    const result = await EnergySource.insertMany(dummySources);
    console.log(dummySources);
    res.status(200).json({
      success: true,
      message: `${result.length} energy sources inserted.`,
    });
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    res.status(500).json({ success: false, error: "Seeding failed" });
  }
});

router.get("/dummytrans", async (req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const days = parseInt(req.query.days as string) || 30;
    const dummyData = createDummyTransactions(days);
    const result = await Transaction.insertMany(dummyData);
    console.log(dummyData);
    res.status(200).json({
      success: true,
      message: `${result.length} transactions inserted for past ${days} days.`,
    });
  } catch (error) {
    console.error("❌ Transaction seeding error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to seed transactions.",
    });
  }
});

router.get("/dummypricing", async (req, res) => {
  try {
    await insertDummyPriceLimits();
    res.status(200).json({ success: true, message: "Dummy data inserted" });
  } catch (err) {
    console.error("Error populating dummy data:", err);
    res.status(500).json({ success: false, message: "Failed to insert data" });
  }
});

export default router;
