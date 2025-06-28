import { Request, Response } from "express";
import dotenv from "dotenv";
import { Transaction } from "../Models/Transaction"; // Adjust path as needed

dotenv.config();

export class AnalyticsController {
  // Fetch transactions from the past 7 days
  async getWeeklyTransactions(req: Request, res: Response): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // Subtract 7 days from the current date

      const transactions = await Transaction.find({
        createdAt: { $gte: sevenDaysAgo },
      });

      res.status(200).json({
        success: true,
        transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch weekly transactions",
      });
    }
  }

  // Fetch transactions from the past month
  async getMonthlyTransactions(req: Request, res: Response): Promise<void> {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // Subtract 1 month from the current date

      const transactions = await Transaction.find({
        createdAt: { $gte: oneMonthAgo },
      });

      res.status(200).json({
        success: true,
        transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch monthly transactions",
      });
    }
  }

  // Fetch price analytics for transactions
  async getPriceAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { min_price, max_price } = req.query;

      const query: any = {};
      if (min_price)
        query.agreed_price_per_kwh = { $gte: parseFloat(min_price as string) };
      if (max_price)
        query.agreed_price_per_kwh = {
          ...query.agreed_price_per_kwh,
          $lte: parseFloat(max_price as string),
        };

      const transactions = await Transaction.find(query);

      res.status(200).json({
        success: true,
        transactions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch price analytics",
      });
    }
  }
}
