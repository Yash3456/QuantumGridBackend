import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db";
import MainRoutes from "./Routes/main";
import rateLimit from "express-rate-limit";
import compression from "compression";

import { connectDatabase } from "./config/prismaconnect";
import { environment } from "./config/environment";
import logger from "./utils/logger";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";

// Import routes
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import energyRoutes from "./routes/energy";
import tradingRoutes from "./routes/trading";

// Import services
import { TradingScheduler } from "./services/TradingAlgorithm";
import { NotificationService } from "./services/NotificationService";

dotenv.config();

class App {
  public app: Application;
  private tradingschedular: TradingScheduler;

  constructor() {
    this.app = express();
    this.tradingschedular = new TradingScheduler();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHadling();
  }

  private initializeMiddleware(): void {
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptsrc: ["'self'"],
            imgsrc: ["'self'", "data:", "https:"],
          },
        },
      })
    );

    this.app.use(
      cors({
        origin: environment?.CORS_ORIGIN
          ? environment.CORS_ORIGIN.split(",")
          : ["http://localhost:5000"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["content-type", "Authorization", "X-Requested-With"],
      })
    );

    const limit = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: {
        error:
          "Too Many Requests from this IP, Please try again after sometime.",
      },
      standardHeaders: true,
      legacyHeaders: true,
    });

    this.app.use("/api/", limit);

    this.app.use(compression());

    this.app.use(
      morgan("combined", {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      })
    );

    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    this.app.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        service: "QuantumGrid Energy Trading API",
        version: "1.0.0",
        environment: environment.NODE_ENV,
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/users", authMiddleware, userRoutes);
    this.app.use("/api/energy", energyRoutes);
    this.app.use("/api/trading", tradingRoutes);

    // API documentation
    this.app.get("/api", (req: Request, res: Response) => {
      res.json({
        message: "QuantumGrid Energy Trading API",
        version: "1.0.0",
        documentation: "/api/docs",
        endpoints: {
          auth: "/api/auth",
          users: "/api/users",
          energy: "/api/energy",
          trading: "/api/trading",
        },
      });
    });

    // 404 handler
    this.app.use("*", (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: "Route not found",
        path: req.originalUrl,
        method: req.method,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeServices(): void {
    // Start trading algorithm in production
    if (environment.NODE_ENV === "production") {
      this.tradingschedular.startContinuousTrading();
      logger.info("🤖 Trading algorithm started");
    }

    // Initialize notification service
    NotificationService.initialize();
    logger.info("📬 Notification service initialized");
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDB();
      await connectDatabase();
      logger.info("📊 Database connected successfully");

      // Start server
      const PORT = environment.PORT || 5000;
      this.app.listen(PORT, () => {
        logger.info(`🚀 QuantumGrid API Server running on port ${PORT}`);
        logger.info(`🌍 Environment: ${environment.NODE_ENV}`);
        logger.info(`📋 API Documentation: http://localhost:${PORT}/api`);
      });
    } catch (error) {
      logger.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }
}

// Start the application
const app = new App();
app.start();

export default app;
