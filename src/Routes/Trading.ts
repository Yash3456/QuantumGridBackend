import express, { Request, Response } from "express";
import { body, query } from "express-validator";
import { handleValidationErrors } from "../middleware/validation";
import {
  getTradeDetails,
  TradingHistory,
  Tradingstatusupdation,
} from "../controller/tradingcontroller";
import {
  getUserEnergyListings,
  TradeCompletionController,
  TradingController,
} from "../controller/EnergyTrading";
import { EnergyListingController } from "../Services/TradingAlgorithm";
import { getAllEnergyListings } from "../controller/EnergyTrading";

const router = express.Router();

const energylisting = new EnergyListingController();
const tradeshistory = new TradingHistory();
const tradingcontroller = new TradingController();
const tradeexecution = new TradeCompletionController();
const tradestatus = new Tradingstatusupdation();

// Get marketplace listings
router.get(
  "/marketplace",
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("state").optional().isString(),
  query("source_type")
    .optional()
    .isIn(["SOLAR", "WIND", "HYDRO", "BIOMASS", "TIDES"]),
  query("min_price").optional().isFloat({ min: 5 }),
  query("max_price").optional().isFloat({ min: 8 }),
  handleValidationErrors,
  energylisting.getEnergyListings
);

// Create energy offer
router.post(
  "/offers",
  body("energy_listing_id").optional().isUUID(),
  body("source_id").isUUID().withMessage("Valid source_id is required"),
  body("user_id").isUUID().withMessage("Valid user_id is required"),
  body("source_type").isString().withMessage("source_type must be a string"),
  body("capacity_kw")
    .isFloat({ min: 0.1 })
    .withMessage("capacity_kw must be a number > 0"),
  body("efficiency_rating")
    .isFloat({ min: 0 })
    .withMessage("efficiency_rating must be a number >= 0"),
  body("energy_price")
    .isFloat({ min: 0.01 })
    .withMessage("energy_price must be >= 0.01"),
  body("status")
    .isIn(["available", "sold", "pending"])
    .withMessage("status must be one of: available, sold, pending"),
  body("meter_id").isString().withMessage("meter_id is required"),
  body("blockchain_hash").optional().isString(),
  body("state").isString().withMessage("state is required"),
  body("source_location").isString().withMessage("source_location is required"),
  handleValidationErrors,
  energylisting.createEnergyListing
);

// Get user's offers
router.get("/useroffers", getUserEnergyListings);

// Get All Existing offers
router.get("/alloffers", getAllEnergyListings);

// Update offer
router.put(
  "/offers/:id",
  body("quantity_kwh").optional().isFloat({ min: 0.1 }),
  body("price_per_kwh").optional().isFloat({ min: 0.01 }),
  body("status").optional().isIn(["ACTIVE", "PAUSED", "CANCELLED"]),
  handleValidationErrors,
  energylisting.updateEnergyListing
);

// Create purchase request
router.post(
  "/requests",
  body("quantity_kwh").isFloat({ min: 0.1 }),
  body("max_price_per_kwh").isFloat({ min: 0.01 }),
  body("required_from").isISO8601(),
  body("required_until").isISO8601(),
  body("energy_type_preference")
    .optional()
    .isIn(["SOLAR", "WIND", "HYDRO", "ANY"]),
  handleValidationErrors,
  tradingcontroller.createPurchaseRequest
);

// Execute trade
router.post(
  "/execute",
  body("offer_id").isUUID(),
  body("quantity_kwh").isFloat({ min: 0.1 }),
  body("agreed_price_per_kwh").isFloat({ min: 0.01 }),
  handleValidationErrors,
  tradeexecution.completeTrade
);

// Get user trades
router.get(
  "/trades",
  query("status")
    .optional()
    .isIn(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
  query("role").optional().isIn(["buyer", "seller", "both"]),
  tradeshistory.getUserTrades
);

// Get trade details
router.get("/trades/:id", getTradeDetails);

// Update trade status (for sellers/dispute resolution)
router.patch(
  "/trades/:id/status",
  body("status").isIn(["CONFIRMED", "IN_PROGRESS", "COMPLETED", "DISPUTED"]),
  body("reason").optional().isString(),
  handleValidationErrors,
  tradestatus.updateTradeStatus
);

// // Market analytics
// router.get(
//   "/analytics",
//   query("timeframe").optional().isIn(["1d", "7d", "30d", "90d"]),
//   tradingController.getMarketAnalytics
// );

export default router;
