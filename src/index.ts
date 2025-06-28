import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db";
import MainRoutes from "./Routes/main";
import rateLimit from "express-rate-limit";

import { environment } from "./config/environment";
import logger from "./utils/logger";

// Import middleware
import { handleValidationErrors as errorHandler } from "./middleware/validation";

// Import services
import { EnergyListingController as TradingScheduler } from "./Services/TradingAlgorithm";

// import { NotificationService } from "./services/NotificationService";

dotenv.config();

class App {
  public app: Application;
  private tradingschedular: TradingScheduler;

  constructor() {
    this.app = express();
    this.tradingschedular = new TradingScheduler();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
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

<<<<<<< HEAD
app.listen(5000, '0.0.0.0', () => {
  console.log("Server running on port 5000");
});

=======
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
    this.app.use("/api", MainRoutes);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  // private initializeServices(): void {
  //   // Start trading algorithm in production
  //   if (environment.NODE_ENV === "production") {
  //     this.tradingschedular.startContinuousTrading();
  //     logger.info("🤖 Trading algorithm started");
  //   }

  //   // Initialize notification service
  //   NotificationService.initialize();
  //   logger.info("📬 Notification service initialized");
  // }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDB();
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
>>>>>>> eb6ba851f866fc9e3937ebfc133190fda59c9017
