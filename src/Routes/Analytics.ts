import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { AnalyticsController } from "../controller/AnalyticsController";
dotenv.config();

const router = express.Router();

const analytics = new AnalyticsController();

router.get("/weekly", analytics.getWeeklyTransactions);
router.get("/monthly", analytics.getMonthlyTransactions);
router.get("/prices", analytics.getPriceAnalytics);

export default router;
